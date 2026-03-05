import { useReactive } from "ahooks";
import { isString } from "es-toolkit";
import { unionBy } from "es-toolkit/compat";
import { useContext, useEffect } from "react";
import { LISTEN_KEY } from "@/constants";
import { selectHistory } from "@/database/history";
import { selectHistoryByTagId } from "@/database/tag";
import { MainContext } from "@/pages/Main";
import { tagStore } from "@/stores/tag";
import { isBlank } from "@/utils/is";
import { useTauriListen } from "./useTauriListen";

interface Options {
  scrollToTop: () => void;
}

export const useHistoryList = (options: Options) => {
  const { scrollToTop } = options;
  const { rootState } = useContext(MainContext);
  const state = useReactive({
    loading: false,
    noMore: false,
    page: 1,
    size: 20,
  });

  const fetchData = async () => {
    try {
      if (state.loading) return;

      state.loading = true;

      const { page } = state;

      // 如果是标签筛选，需要特殊处理
      const { selectedTagId } = tagStore;
      let historyIds: string[] = [];

      if (selectedTagId) {
        const results = await selectHistoryByTagId(selectedTagId);
        historyIds = results.map((r) => r.historyId);
      }

      const list = await selectHistory((qb) => {
        const { size } = state;
        const { group, search } = rootState;
        const isFavoriteGroup = group === "favorite";
        const isNormalGroup =
          group !== "all" && !isFavoriteGroup && !selectedTagId;
        const isTagGroup = !!selectedTagId;

        return qb
          .$if(isFavoriteGroup, (eb) => eb.where("favorite", "=", true))
          .$if(isNormalGroup, (eb) => eb.where("group", "=", group))
          .$if(isTagGroup && historyIds.length > 0, (eb) =>
            eb.where("id", "in", historyIds),
          )
          .$if(isTagGroup && historyIds.length === 0, (eb) =>
            eb.where("id", "=", "__no_match__"),
          ) // 无匹配时返回空
          .$if(!isBlank(search), (eb) => {
            return eb.where((eb) => {
              return eb.or([
                eb("search", "like", eb.val(`%${search}%`)),
                eb("note", "like", eb.val(`%${search}%`)),
              ]);
            });
          })
          .offset((page - 1) * size)
          .limit(size)
          .orderBy("createTime", "desc");
      });

      // 同步处理 files 类型，确保路径数据正确
      for (const item of list) {
        const { type, value } = item;
        if (type === "files" && isString(value)) {
          item.value = JSON.parse(value);
        }
      }

      state.noMore = list.length === 0;

      if (page === 1) {
        rootState.list = list;

        if (state.noMore) return;

        return scrollToTop();
      }

      rootState.list = unionBy(rootState.list, list, "id");
    } finally {
      state.loading = false;
    }
  };

  const reload = () => {
    state.page = 1;
    state.noMore = false;

    return fetchData();
  };

  const loadMore = () => {
    if (state.noMore) return;

    state.page += 1;

    fetchData();
  };

  useTauriListen(LISTEN_KEY.REFRESH_CLIPBOARD_LIST, reload);

  // 切换选项卡或搜索时重新加载
  useEffect(() => {
    // 清空选中状态和列表，立即响应切换
    rootState.selectedIds = [];
    rootState.list = [];

    // 使用 requestAnimationFrame 确保 UI 先完成切换动画
    requestAnimationFrame(() => {
      reload();
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootState.group, rootState.search, tagStore.selectedTagId]);

  return {
    loadMore,
    reload,
  };
};
