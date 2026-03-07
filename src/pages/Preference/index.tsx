import { emit } from "@tauri-apps/api/event";
import { useCreation, useMount } from "ahooks";
import { Flex } from "antd";
import clsx from "clsx";
import { MacScrollbar } from "mac-scrollbar";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import UnoIcon from "@/components/UnoIcon";
import UpdateApp from "@/components/UpdateApp";
import { LISTEN_KEY } from "@/constants";
import { useRegister } from "@/hooks/useRegister";
import { useSubscribe } from "@/hooks/useSubscribe";
import { useTray } from "@/hooks/useTray";
import { isAutostart } from "@/plugins/autostart";
import { showWindow, toggleWindowVisible } from "@/plugins/window";
import { clipboardStore } from "@/stores/clipboard";
import { globalStore } from "@/stores/global";
import { imageHostingStore } from "@/stores/imageHosting";
import { raf } from "@/utils/bom";
import { isMac } from "@/utils/is";
import { saveStore } from "@/utils/store";
import About from "./components/About";
import Clipboard from "./components/Clipboard";
import General from "./components/General";
import History from "./components/History";
import ImageHosting from "./components/ImageHosting";
import Shortcut from "./components/Shortcut";
import Sync from "./components/Sync";
import Tags from "./components/Tags";
import styles from "./index.module.scss";

const Preference = () => {
  const { t } = useTranslation();
  const { app, shortcut, appearance } = useSnapshot(globalStore);
  const [activeKey, setActiveKey] = useState("general");
  const contentRef = useRef<HTMLElement>(null);

  const { createTray } = useTray();

  useMount(async () => {
    createTray();

    const autostart = await isAutostart();

    if (!autostart && !app.silentStart) {
      showWindow();
    }
  });

  // 监听全局配置项变化
  useSubscribe(globalStore, () => handleStoreChanged());

  // 监听剪贴板配置项变化
  useSubscribe(clipboardStore, () => handleStoreChanged());

  // 监听快捷键切换窗口显隐
  useRegister(toggleWindowVisible, [shortcut.preference]);

  // 监听图床配置项变化
  useSubscribe(imageHostingStore, () => handleStoreChanged());

  // 配置项变化通知其它窗口和本地存储
  const handleStoreChanged = () => {
    emit(LISTEN_KEY.STORE_CHANGED, {
      clipboardStore,
      globalStore,
      imageHostingStore,
    });

    saveStore();
  };

  const menuItems = useCreation(() => {
    return [
      {
        content: <General />,
        icon: "i-lucide:bolt",
        key: "general",
        label: t("preference.menu.title.general"),
      },
      {
        content: <Clipboard />,
        icon: "i-lucide:clipboard-list",
        key: "clipboard",
        label: t("preference.menu.title.clipboard"),
      },
      {
        content: <History />,
        icon: "i-lucide:history",
        key: "history",
        label: t("preference.menu.title.history"),
      },
      {
        content: <Tags />,
        icon: "i-lucide:tags",
        key: "tags",
        label: t("preference.menu.title.tags"),
      },
      {
        content: <Shortcut />,
        icon: "i-lucide:keyboard",
        key: "shortcut",
        label: t("preference.menu.title.shortcut"),
      },
      {
        content: <Sync />,
        icon: "i-lucide:refresh-cw",
        key: "sync",
        label: t("preference.menu.title.sync"),
      },
      {
        content: <ImageHosting />,
        icon: "i-lucide:image",
        key: "imageHosting",
        label: "图床",
      },
      {
        content: <About />,
        icon: "i-lucide:info",
        key: "about",
        label: t("preference.menu.title.about"),
      },
    ];
  }, [appearance.language]);

  const handleMenuClick = (key: string) => {
    setActiveKey(key);

    raf(() => {
      contentRef.current?.scrollTo({ behavior: "smooth", top: 0 });
    });
  };

  return (
    <Flex className={clsx("h-screen overflow-hidden", styles.container)}>
      {/* 左侧菜单栏 - Win11 风格 */}
      <Flex
        className={clsx(
          "h-full flex-col p-3",
          styles.sidebar,
          isMac ? "pt-8" : "bg-color-1",
        )}
        data-tauri-drag-region
        gap="small"
        vertical
      >
        {menuItems.map((item) => {
          const { key, label, icon } = item;
          const isActive = activeKey === key;

          return (
            <Flex
              align="center"
              className={clsx(
                styles.menuItem,
                "cursor-pointer px-4 py-3 transition-all duration-200",
                isActive && styles.active,
              )}
              gap="small"
              key={key}
              onClick={() => handleMenuClick(key)}
            >
              <UnoIcon
                className={clsx(isActive ? "text-white" : "text-color-2")}
                name={icon}
                size={18}
              />
              <span
                className={clsx(
                  "font-medium text-sm",
                  isActive ? "text-white" : "text-color-2",
                )}
              >
                {label}
              </span>
            </Flex>
          );
        })}
      </Flex>

      {/* 右侧内容区域 */}
      <div
        className={clsx("flex-1 overflow-hidden bg-color-2", styles.content)}
      >
        <MacScrollbar
          className="h-full p-6"
          data-tauri-drag-region
          ref={contentRef}
          skin={appearance.isDark ? "dark" : "light"}
        >
          {menuItems.map((item) => {
            const { key, content } = item;

            return (
              <div hidden={key !== activeKey} key={key}>
                {content}
              </div>
            );
          })}
        </MacScrollbar>
      </div>

      <UpdateApp />
    </Flex>
  );
};

export default Preference;
