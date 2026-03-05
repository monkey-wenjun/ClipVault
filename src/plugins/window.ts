import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LISTEN_KEY, WINDOW_LABEL } from "@/constants";
import { clipboardStore } from "@/stores/clipboard";
import type { WindowLabel } from "@/types/plugin";
import { isLinux } from "@/utils/is";

const COMMAND = {
  HIDE_WINDOW: "plugin:eco-window|hide_window",
  SHOW_TASKBAR_ICON: "plugin:eco-window|show_taskbar_icon",
  SHOW_WINDOW: "plugin:eco-window|show_window",
};

/**
 * 显示窗口
 */
export const showWindow = (label?: WindowLabel) => {
  if (label) {
    emit(LISTEN_KEY.SHOW_WINDOW, label);
  } else {
    invoke(COMMAND.SHOW_WINDOW);
  }
};

/**
 * 隐藏窗口
 */
export const hideWindow = () => {
  invoke(COMMAND.HIDE_WINDOW);
};

/**
 * 切换窗口的显示和隐藏
 */
export const toggleWindowVisible = async () => {
  const appWindow = getCurrentWebviewWindow();

  let focused = await appWindow.isFocused();

  if (isLinux) {
    focused = await appWindow.isVisible();
  }

  if (focused) {
    return hideWindow();
  }

  if (appWindow.label === WINDOW_LABEL.MAIN) {
    const { window } = clipboardStore;

    // 激活时回到顶部
    if (window.backTop) {
      await emit(LISTEN_KEY.ACTIVATE_BACK_TOP);
    }

    // 窗口位置和尺寸由 Rust 后端统一管理，前端不再覆盖
    // 保持原有逻辑：标准模式和 Dock 模式都在 Rust 端处理
  }

  showWindow();
};

/**
 * 显示任务栏图标
 */
export const showTaskbarIcon = (visible = true) => {
  invoke(COMMAND.SHOW_TASKBAR_ICON, { visible });
};
