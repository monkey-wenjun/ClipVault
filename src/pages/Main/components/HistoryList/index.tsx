import { useKeyPress, useUpdateEffect } from "ahooks";
import { Modal, message } from "antd";
import clsx from "clsx";
import { findIndex } from "es-toolkit/compat";
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ImagePreview from "@/components/ImagePreview";
import TagSelector, { type TagSelectorRef } from "@/components/TagSelector";
import { LISTEN_KEY } from "@/constants";
import { deleteHistory } from "@/database/history";
import { selectHistoryTagIds } from "@/database/tag";
import { useHistoryList } from "@/hooks/useHistoryList";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useTauriListen } from "@/hooks/useTauriListen";
import type { DatabaseSchemaHistory } from "@/types/database";
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

  // 图片预览状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] =
    useState<DatabaseSchemaHistory<"image"> | null>(null);

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

  // Ctrl+A 全选（只选当前列表中的项目）
  useKeyPress("ctrl.a", (event) => {
    event?.preventDefault();
    if (rootState.list.length === 0) return;
    // 只选择当前列表（当前选项卡）中的项目
    const currentListIds = rootState.list.map((item) => item.id);
    // 保留其他已选中的不在当前列表的项目（如果有的话），但通常切换选项卡时会清空
    const otherSelectedIds = rootState.selectedIds.filter(
      (id) => !currentListIds.includes(id),
    );
    rootState.selectedIds = [...otherSelectedIds, ...currentListIds];
  });

  // Delete 键删除选中的历史记录（异步删除，先更新UI）
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

      // 先更新UI
      rootState.list = rootState.list.filter((i) => i.id !== activeId);
      rootState.activeId = rootState.list[0]?.id;
      message.success(t("clipboard.button.context_menu.delete") + t("success"));

      // 后台异步删除
      deleteHistory(item).catch(() => {});
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

      // 先更新UI
      rootState.list = rootState.list.filter(
        (item) => !rootState.selectedIds.includes(item.id),
      );
      const deletedCount = rootState.selectedIds.length;
      rootState.selectedIds = [];
      rootState.activeId = rootState.list[0]?.id;
      message.success(`成功删除 ${deletedCount} 项`);

      // 后台异步删除
      Promise.allSettled(itemsToDelete.map((item) => deleteHistory(item)))
        .then((results) => {
          const failed = results.filter((r) => r.status === "rejected").length;
          if (failed > 0) {
            // console.warn(`${failed} 项删除失败`);
          }
        })
        .catch(() => {});
    }
  });

  // 空格键预览图片
  useKeyPress("space", (event) => {
    event?.preventDefault();
    const { activeId } = rootState;
    if (!activeId) return;

    const item = rootState.list.find((i) => i.id === activeId);
    if (!item || item.type !== "image") return;

    setPreviewImage(item as DatabaseSchemaHistory<"image">);
    setPreviewVisible(true);
  });

  // 关闭图片预览
  const handleClosePreview = () => {
    setPreviewVisible(false);
    setPreviewImage(null);
  };

  // 删除预览的图片（异步删除，先更新UI）
  const handleDeletePreviewImage = async () => {
    if (!previewImage) return;

    const confirmed = await deleteModal.confirm({
      content: t("clipboard.hints.delete_modal_content"),
      title: t("clipboard.button.context_menu.delete"),
    });

    if (!confirmed) return;

    const imageToDelete = previewImage;

    // 先更新UI
    rootState.list = rootState.list.filter((i) => i.id !== imageToDelete.id);
    rootState.activeId = rootState.list[0]?.id;
    handleClosePreview();
    message.success(t("clipboard.button.context_menu.delete") + t("success"));

    // 后台异步删除
    deleteHistory(imageToDelete).catch(() => {});
  };

  // 处理标签选择
  const handleTag = async (historyId: string) => {
    const tagIds = await selectHistoryTagIds(historyId);
    setCurrentHistoryId(historyId);
    setCurrentTagIds(tagIds);
    tagSelectorRef.current?.open(historyId, tagIds);
  };

  // 点击列表空白区域时取消全选
  const handleListClick = (e: React.MouseEvent) => {
    // 如果点击的是列表本身（不是卡片项），则清空选中
    if (e.target === e.currentTarget) {
      rootState.selectedIds = [];
    }
  };

  // 使用 Set 优化选中状态查找
  const selectedSet = new Set(rootState.selectedIds);

  return (
    <div className={styles.container}>
      <div
        className={styles.list}
        onClick={handleListClick}
        onWheel={handleWheel}
        ref={scrollerRef}
      >
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
              isActive={rootState.activeId === item.id}
              isSelected={selectedSet.has(item.id)}
              search={rootState.search}
            />
          </div>
        ))}
      </div>

      <NoteModal ref={noteModelRef} />
      <TagSelector ref={tagSelectorRef} />

      <ImagePreview
        data={previewImage}
        onClose={handleClosePreview}
        onDelete={handleDeletePreviewImage}
        visible={previewVisible}
      />

      {contextHolder}
    </div>
  );
};

export default HistoryList;
