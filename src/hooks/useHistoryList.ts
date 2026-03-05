import { copyFile, exists, remove } from "@tauri-apps/plugin-fs";
import { useReactive } from "ahooks";
import { isString } from "es-toolkit";
import { unionBy } from "es-toolkit/compat";
import { useContext, useEffect } from "react";
import { getDefaultSaveImagePath } from "tauri-plugin-clipboard-x-api";
import { LISTEN_KEY } from "@/constants";
import { selectHistory } from "@/database/history";
import { selectHistoryByTagId } from "@/database/tag";
import { MainContext } from "@/pages/Main";
import { tagStore } from "@/stores/tag";
import { isBlank } from "@/utils/is";
import { getSaveImagePath, join } from "@/utils/path";
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

      // 图片路径处理改为异步，不阻塞列表渲染
      const processImagesAsync = async () => {
        for (const item of list) {
          const { type, value } = item;

          if (!isString(value)) continue;

          if (type === "image") {
            const oldPath = join(getSaveImagePath(), value);
            const newPath = join(await getDefaultSaveImagePath(), value);

            if (await exists(oldPath)) {
              await copyFile(oldPath, newPath);
              remove(oldPath);
              item.value = newPath;
            }
          }

          if (type === "files") {
            item.value = JSON.parse(value);
          }
        }
      };

      // 启动异步处理，不等待完成
      processImagesAsync();

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

    // 使用 setTimeout 让出主线程，让 UI 先完成切换动画
    const timer = setTimeout(() => {
      reload();
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootState.group, rootState.search, tagStore.selectedTagId]);

  return {
    loadMore,
    reload,
  };
};
