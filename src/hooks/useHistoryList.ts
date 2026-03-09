import { useReactive, useUpdateEffect } from "ahooks";
import { isString } from "es-toolkit";
import { unionBy } from "es-toolkit/compat";
import { useContext, useEffect } from "react";
import { useSnapshot } from "valtio";
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
  const snapshot = useSnapshot(tagStore);
  const state = useReactive({
    loading: false,
    noMore: false,
    page: 1,
    size: 20,
  });

  // 直接根据当前状态获取数据的函数
  const fetchData = async (
    currentGroup = snapshot.group,
    currentTagId = snapshot.selectedTagId,
    search = rootState.search,
  ) => {
    try {
      if (state.loading) return;

      state.loading = true;

      const { page } = state;

      // 如果是标签筛选，需要特殊处理
      let historyIds: string[] = [];

      if (currentTagId) {
        const results = await selectHistoryByTagId(currentTagId);
        historyIds = results.map((r) => r.historyId);
      }

      const isFavoriteGroup = currentGroup === "favorite";
      const isNormalGroup =
        currentGroup !== "all" && !isFavoriteGroup && !currentTagId;
      const isTagGroup = !!currentTagId;

      const list = await selectHistory((qb) => {
        const { size } = state;

        return qb
          .$if(isFavoriteGroup, (eb) => eb.where("favorite", "=", true))
          .$if(isNormalGroup, (eb) => eb.where("group", "=", currentGroup))
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
        // 第一页直接替换，避免切换标签/搜索时旧数据干扰
        rootState.list = list;

        if (state.noMore) return;

        return scrollToTop();
      }

      // 加载更多时合并数据
      const merged = unionBy(rootState.list, list, "id");
      merged.sort(
        (a, b) =>
          new Date(b.createTime).getTime() - new Date(a.createTime).getTime(),
      );
      rootState.list = merged;
    } finally {
      state.loading = false;
    }
  };

  const reload = () => {
    state.page = 1;
    state.noMore = false;

    // 直接传入当前最新值
    return fetchData(snapshot.group, snapshot.selectedTagId, rootState.search);
  };

  const loadMore = () => {
    if (state.noMore) return;

    state.page += 1;

    fetchData(snapshot.group, snapshot.selectedTagId, rootState.search);
  };

  useTauriListen(LISTEN_KEY.REFRESH_CLIPBOARD_LIST, reload);

  // 初始加载
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切换选项卡或标签时重新加载
  useUpdateEffect(() => {
    // 清空选中状态，保留列表避免闪烁，立即重新加载
    rootState.selectedIds = [];

    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.group, snapshot.selectedTagId]);

  // 搜索单独处理，避免频繁触发
  useUpdateEffect(() => {
    rootState.selectedIds = [];
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootState.search]);

  return {
    loadMore,
    reload,
  };
};
