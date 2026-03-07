import { Flex } from "antd";
import clsx from "clsx";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import UnoIcon from "@/components/UnoIcon";
import { hideWindow, showWindow } from "@/plugins/window";
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
  const { t } = useTranslation();

  // 统计数据
  const totalCount = rootState.list.length;
  const favoriteCount = rootState.list.filter((item) => item.favorite).length;

  return (
    <Flex
      className={clsx(
        styles.container,
        "h-screen overflow-hidden rounded-2.5 bg-color-1",
        {
          "b b-color-1": isLinux,
        },
      )}
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

            <div
              className={styles.iconBtn}
              onClick={() => {
                showWindow("preference");
              }}
            >
              <UnoIcon name="i-lets-icons:setting-alt-line" />
            </div>

            <div
              className={styles.iconBtn}
              onClick={() => {
                hideWindow();
              }}
            >
              <UnoIcon name="i-lucide:x" />
            </div>
          </Flex>
        </Flex>

        {/* 历史列表 - 横向卡片 */}
        <HistoryList />

        {/* 底部状态栏 */}
        <div className={styles.statusbar} data-tauri-drag-region>
          <div className={styles.statusItem}>
            <span>📋</span>
            <span>{t("clipboard.status.total", { count: totalCount })}</span>
          </div>
          <div className={styles.statusItem}>
            <span>⭐</span>
            <span>
              {t("clipboard.status.favorite", { count: favoriteCount })}
            </span>
          </div>
          <div className={clsx(styles.statusItem, styles.right)}>
            <span>← →</span>
            <span>{t("clipboard.status.navigate")}</span>
          </div>
          <div className={styles.statusItem}>
            <span>↵</span>
            <span>{t("clipboard.status.paste")}</span>
          </div>
          <div className={styles.statusItem}>
            <span>ESC</span>
            <span>{t("clipboard.status.close")}</span>
          </div>
        </div>
      </Flex>

      {/* 右侧边栏 */}
      <Sidebar />
    </Flex>
  );
};

export default StandardMode;
