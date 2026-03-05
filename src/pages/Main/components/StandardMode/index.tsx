import { Flex } from "antd";
import clsx from "clsx";
import { useContext } from "react";
import { useSnapshot } from "valtio";
import UnoIcon from "@/components/UnoIcon";
import { showWindow } from "@/plugins/window";
import { clipboardStore } from "@/stores/clipboard";
import { isLinux } from "@/utils/is";
import { MainContext } from "../..";
import GroupList from "../GroupList";
import HistoryList from "../HistoryList";
import SearchInput from "../SearchInput";
import Sidebar from "../Sidebar";
import WindowPin from "../WindowPin";
import styles from "./index.module.scss";

const StandardMode = () => {
  const { rootState } = useContext(MainContext);
  const { search } = useSnapshot(clipboardStore);

  // 统计数据
  const totalCount = rootState.list.length;
  const favoriteCount = rootState.list.filter((item) => item.favorite).length;

  return (
    <Flex
      className={clsx(styles.container, "h-screen overflow-hidden bg-color-1", {
        "b b-color-1": isLinux,
        "flex-col-reverse": search.position === "bottom",
        "rounded-2.5": true,
      })}
      data-tauri-drag-region
      gap={0}
    >
      {/* 主内容区域 */}
      <Flex
        className="flex-1 flex-col overflow-hidden"
        data-tauri-drag-region
        gap={12}
      >
        {/* 顶部工具栏 - Win11 风格 */}
        <Flex
          align="center"
          className={styles.toolbar}
          data-tauri-drag-region
          gap="small"
          justify="space-between"
        >
          {/* 搜索框 */}
          <SearchInput />

          {/* 分隔线 */}
          <div className={styles.divider} />

          {/* 标签页 */}
          <GroupList />

          {/* 右侧操作按钮 */}
          <Flex
            align="center"
            className={styles.actions}
            data-tauri-drag-region
            gap={4}
          >
            <WindowPin />

            <UnoIcon
              className={styles.iconBtn}
              hoverable
              name="i-lets-icons:setting-alt-line"
              onClick={() => {
                showWindow("preference");
              }}
            />

            <UnoIcon
              className={styles.iconBtn}
              hoverable
              name="i-lucide:x"
              onClick={() => {
                // 关闭窗口
              }}
            />
          </Flex>
        </Flex>

        {/* 历史列表 - 横向卡片 */}
        <HistoryList />

        {/* 底部状态栏 */}
        <div className={styles.statusbar} data-tauri-drag-region>
          <div className={styles.statusItem}>
            <span>📋</span>
            <span>{totalCount} 条记录</span>
          </div>
          <div className={styles.statusItem}>
            <span>⭐</span>
            <span>{favoriteCount} 条收藏</span>
          </div>
          <div className={clsx(styles.statusItem, styles.right)}>
            <span>← →</span>
            <span>导航</span>
          </div>
          <div className={styles.statusItem}>
            <span>↵</span>
            <span>粘贴</span>
          </div>
          <div className={styles.statusItem}>
            <span>ESC</span>
            <span>关闭</span>
          </div>
        </div>
      </Flex>

      {/* 右侧边栏 */}
      <Sidebar />
    </Flex>
  );
};

export default StandardMode;
