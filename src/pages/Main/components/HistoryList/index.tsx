import { useKeyPress, useUpdateEffect } from "ahooks";
import { Modal, message } from "antd";
import clsx from "clsx";
import { findIndex } from "es-toolkit/compat";
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import TagSelector, { type TagSelectorRef } from "@/components/TagSelector";
import { LISTEN_KEY } from "@/constants";
import { deleteHistory } from "@/database/history";
import { selectHistoryTagIds } from "@/database/tag";
import { useHistoryList } from "@/hooks/useHistoryList";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useTauriListen } from "@/hooks/useTauriListen";
import { MainContext } from "../..";
import Item from "./components/Item";
import NoteModal, { type NoteModalRef } from "./components/NoteModal";
import styles from "./index.module.scss";

const HistoryList = () => {
  const { rootState } = useContext(MainContext);
  const { t } = useTranslation();
  const noteModelRef = useRef<NoteModalRef>(null);
  const tagSelectorRef = useRef<TagSelectorRef>(null);
  const [deleteModal, contextHolder] = Modal.useModal();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [, setCurrentHistoryId] = useState<string>("");
  const [, setCurrentTagIds] = useState<string[]>([]);

  const scrollToIndex = (index: number) => {
    const container = scrollerRef.current;
    if (!container) return;

    const items = container.querySelectorAll("[data-item-index]");
    const targetItem = items[index] as HTMLElement;
    if (!targetItem) return;

    // 横向滚动到指定位置
    const containerRect = container.getBoundingClientRect();
    const itemRect = targetItem.getBoundingClientRect();
    const scrollLeft =
      container.scrollLeft +
      itemRect.left -
      containerRect.left -
      containerRect.width / 2 +
      itemRect.width / 2;

    container.scrollTo({ behavior: "smooth", left: scrollLeft });
  };

  const scrollToTop = () => {
    if (rootState.list.length === 0) return;

    scrollToIndex(0);
    rootState.activeId = rootState.list[0].id;
  };

  useKeyboard({ scrollToTop });

  useHistoryList({ scrollToTop });

  useTauriListen(LISTEN_KEY.ACTIVATE_BACK_TOP, scrollToTop);

  useUpdateEffect(() => {
    const { list } = rootState;

    if (list.length === 0) {
      rootState.activeId = void 0;
    } else {
      rootState.activeId ??= list[0].id;
    }
  }, [rootState.list.length]);

  useEffect(() => {
    const { list, activeId } = rootState;

    if (!activeId) return;

    const index = findIndex(list, { id: activeId });

    if (index < 0) return;

    scrollToIndex(index);
  }, [rootState.activeId]);

  // 横向滚轮支持
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY === 0) return;
    e.preventDefault();
    const container = scrollerRef.current;
    if (!container) return;
    container.scrollLeft += e.deltaY;
  };

  // 上下键切换条目（在横向布局中，上下键映射为左右移动）
  const selectPrevItem = () => {
    const { list, activeId } = rootState;
    if (list.length === 0) return;

    const currentIndex = activeId ? findIndex(list, { id: activeId }) : 0;
    if (currentIndex <= 0) return; // 已经在第一个

    const prevIndex = currentIndex - 1;
    rootState.activeId = list[prevIndex].id;
    scrollToIndex(prevIndex);
  };

  const selectNextItem = () => {
    const { list, activeId } = rootState;
    if (list.length === 0) return;

    const currentIndex = activeId ? findIndex(list, { id: activeId }) : -1;
    if (currentIndex >= list.length - 1) return; // 已经在最后一个

    const nextIndex = currentIndex + 1;
    rootState.activeId = list[nextIndex].id;
    scrollToIndex(nextIndex);
  };

  // 监听上下键和 Tab 键切换条目
  useKeyPress("uparrow", selectPrevItem);
  useKeyPress("downarrow", selectNextItem);
  useKeyPress("tab", selectNextItem);

  // Ctrl+A 全选
  useKeyPress("ctrl.a", (event) => {
    event?.preventDefault();
    if (rootState.list.length === 0) return;
    rootState.selectedIds = rootState.list.map((item) => item.id);
  });

  // Delete 键删除选中的历史记录
  useKeyPress("delete", async () => {
    if (rootState.selectedIds.length === 0) {
      // 如果没有选中项，删除当前激活项
      const { activeId } = rootState;
      if (!activeId) return;

      const item = rootState.list.find((i) => i.id === activeId);
      if (!item) return;

      const confirmed = await deleteModal.confirm({
        content: t("clipboard.hints.delete_modal_content"),
        title: t("clipboard.button.context_menu.delete"),
      });

      if (!confirmed) return;

      await deleteHistory(item);
      rootState.list = rootState.list.filter((i) => i.id !== activeId);
      rootState.activeId = rootState.list[0]?.id;
      message.success(t("clipboard.button.context_menu.delete") + t("success"));
    } else {
      // 删除所有选中的项
      const confirmed = await deleteModal.confirm({
        content: `确定要删除选中的 ${rootState.selectedIds.length} 项吗？`,
        title: "批量删除",
      });

      if (!confirmed) return;

      const itemsToDelete = rootState.list.filter((item) =>
        rootState.selectedIds.includes(item.id),
      );

      for (const item of itemsToDelete) {
        await deleteHistory(item);
      }

      rootState.list = rootState.list.filter(
        (item) => !rootState.selectedIds.includes(item.id),
      );
      rootState.selectedIds = [];
      rootState.activeId = rootState.list[0]?.id;
      message.success("删除成功");
    }
  });

  // 处理标签选择
  const handleTag = async (historyId: string) => {
    const tagIds = await selectHistoryTagIds(historyId);
    setCurrentHistoryId(historyId);
    setCurrentTagIds(tagIds);
    tagSelectorRef.current?.open(historyId, tagIds);
  };

  return (
    <div className={styles.container}>
      <div className={styles.list} onWheel={handleWheel} ref={scrollerRef}>
        {rootState.list.map((item, index) => (
          <div
            className={clsx(styles.itemWrapper)}
            data-item-index={index}
            key={item.id}
          >
            <Item
              data={item}
              deleteModal={deleteModal}
              handleNote={() => noteModelRef.current?.open(item.id)}
              handleTag={() => handleTag(item.id)}
              index={index}
            />
          </div>
        ))}
      </div>

      <NoteModal ref={noteModelRef} />
      <TagSelector ref={tagSelectorRef} />

      {contextHolder}
    </div>
  );
};

export default HistoryList;
