import { invoke } from "@tauri-apps/api/core";
import { clipboardStore } from "@/stores/clipboard";

/**
 * 获取当前前台应用名称
 */
export const getForegroundAppName = async (): Promise<string> => {
  try {
    return await invoke("get_foreground_app_name");
  } catch {
    return "";
  }
};

/**
 * 检查当前前台应用是否在排除列表中
 */
export const isAppExcluded = async (): Promise<boolean> => {
  const { apps } = clipboardStore.exclusion;

  if (apps.length === 0) return false;

  const currentApp = await getForegroundAppName();
  if (!currentApp) return false;

  // 不区分大小写匹配
  return apps.some((app) =>
    currentApp.toLowerCase().includes(app.toLowerCase()),
  );
};

/**
 * 添加应用到排除列表
 */
export const addExcludedApp = (appName: string) => {
  const trimmed = appName.trim();
  if (!trimmed) return;

  if (!clipboardStore.exclusion.apps.includes(trimmed)) {
    clipboardStore.exclusion.apps.push(trimmed);
  }
};

/**
 * 从排除列表移除应用
 */
export const removeExcludedApp = (appName: string) => {
  const index = clipboardStore.exclusion.apps.indexOf(appName);
  if (index !== -1) {
    clipboardStore.exclusion.apps.splice(index, 1);
  }
};
