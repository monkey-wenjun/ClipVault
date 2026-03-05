import { useKeyPress, useUpdateEffect } from "ahooks";
import { Modal } from "antd";
import clsx from "clsx";
import { findIndex } from "es-toolkit/compat";
import { useContext, useEffect, useRef } from "react";
import { LISTEN_KEY } from "@/constants";
import { useHistoryList } from "@/hooks/useHistoryList";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useTauriListen } from "@/hooks/useTauriListen";
import { MainContext } from "../..";
import Item from "./components/Item";
import NoteModal, { type NoteModalRef } from "./components/NoteModal";
import styles from "./index.module.scss";

const HistoryList = () => {
  const { rootState } = useContext(MainContext);
  const noteModelRef = useRef<NoteModalRef>(null);
  const [deleteModal, contextHolder] = Modal.useModal();
  const scrollerRef = useRef<HTMLDivElement>(null);

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
              index={index}
            />
          </div>
        ))}
      </div>

      <NoteModal ref={noteModelRef} />

      {contextHolder}
    </div>
  );
};

export default HistoryList;
