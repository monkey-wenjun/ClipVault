import { invoke } from "@tauri-apps/api/core";

/**
 * 设置同步目录路径
 */
export const setSyncPath = async (path: string): Promise<void> => {
  await invoke("plugin:eco-sync|set_sync_path", { path });
};

/**
 * 获取同步目录路径
 */
export const getSyncPath = async (): Promise<string | null> => {
  return await invoke("plugin:eco-sync|get_sync_path");
};

/**
 * 启用/禁用同步
 */
export const enableSync = async (enabled: boolean): Promise<void> => {
  await invoke("plugin:eco-sync|enable_sync", { enabled });
};

/**
 * 检查同步是否启用
 */
export const isSyncEnabled = async (): Promise<boolean> => {
  return await invoke("plugin:eco-sync|is_sync_enabled");
};

/**
 * 立即执行同步
 */
export const syncNow = async (): Promise<void> => {
  await invoke("plugin:eco-sync|sync_now");
};

/**
 * 从同步目录恢复数据
 */
export const restoreFromSync = async (): Promise<void> => {
  await invoke("plugin:eco-sync|restore_from_sync");
};

/**
 * 设置加密密钥
 */
export const setEncryptionKey = async (key: string | null): Promise<void> => {
  await invoke("plugin:eco-sync|set_encryption_key", { key });
};

/**
 * 检查加密是否启用
 */
export const isEncryptionEnabled = async (): Promise<boolean> => {
  return await invoke("plugin:eco-sync|is_encryption_enabled");
};

/**
 * 获取同步状态
 */
export const getSyncStatus = async (): Promise<{
  enabled: boolean;
  sync_path: string | null;
  encryption_enabled: boolean;
  is_syncing: boolean;
  last_sync: string | null;
}> => {
  return await invoke("plugin:eco-sync|get_sync_status");
};

// 防抖计时器
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 生成加密密钥
 */
export const generateEncryptionKey = (): string => {
  const chars = "0123456789abcdef";
  let key = "";
  for (let i = 0; i < 64; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
};

/**
 * 触发自动同步（带防抖）
 * 在剪贴板内容变化时调用
 */
export const triggerAutoSync = async (): Promise<void> => {
  // 清除之前的计时器
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  // 设置新的防抖计时器（延迟 3 秒执行，避免频繁同步）
  syncDebounceTimer = setTimeout(async () => {
    try {
      const enabled = await isSyncEnabled();
      if (!enabled) return;

      const path = await getSyncPath();
      if (!path) return;

      await syncNow();
    } catch (error) {
      void error;
    }
  }, 3000);
};

/**
 * 启动定时同步
 * @param intervalMinutes 同步间隔（分钟）
 */
export const startPeriodicSync = (intervalMinutes = 5): (() => void) => {
  const intervalMs = intervalMinutes * 60 * 1000;

  const timer = setInterval(async () => {
    try {
      const enabled = await isSyncEnabled();
      if (!enabled) return;

      const path = await getSyncPath();
      if (!path) return;

      await syncNow();
    } catch (error) {
      void error;
    }
  }, intervalMs);

  // 返回取消函数
  return () => clearInterval(timer);
};
