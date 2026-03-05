import { invoke } from "@tauri-apps/api/core";

const COMMAND = {
  ENABLE_SYNC: "plugin:eco-sync|enable_sync",
  GET_SYNC_PATH: "plugin:eco-sync|get_sync_path",
  IS_ENCRYPTION_ENABLED: "plugin:eco-sync|is_encryption_enabled",
  IS_SYNC_ENABLED: "plugin:eco-sync|is_sync_enabled",
  SET_ENCRYPTION_KEY: "plugin:eco-sync|set_encryption_key",
  SET_SYNC_PATH: "plugin:eco-sync|set_sync_path",
  SYNC_NOW: "plugin:eco-sync|sync_now",
};

/**
 * 设置同步目录路径
 */
export const setSyncPath = async (path: string): Promise<void> => {
  await invoke(COMMAND.SET_SYNC_PATH, { path });
};

/**
 * 获取同步目录路径
 */
export const getSyncPath = async (): Promise<string | null> => {
  return await invoke(COMMAND.GET_SYNC_PATH);
};

/**
 * 启用/禁用同步
 */
export const enableSync = async (enabled: boolean): Promise<void> => {
  await invoke(COMMAND.ENABLE_SYNC, { enabled });
};

/**
 * 检查同步是否启用
 */
export const isSyncEnabled = async (): Promise<boolean> => {
  return await invoke(COMMAND.IS_SYNC_ENABLED);
};

/**
 * 立即执行同步
 */
export const syncNow = async (): Promise<void> => {
  await invoke(COMMAND.SYNC_NOW);
};

/**
 * 设置加密密钥
 * @param key hex 编码的 32 字节密钥 (64 字符)，或 null 禁用加密
 */
export const setEncryptionKey = async (key: string | null): Promise<void> => {
  await invoke(COMMAND.SET_ENCRYPTION_KEY, { key });
};

/**
 * 检查加密是否启用
 */
export const isEncryptionEnabled = async (): Promise<boolean> => {
  return await invoke(COMMAND.IS_ENCRYPTION_ENABLED);
};

/**
 * 生成随机 AES-256 密钥
 */
export const generateEncryptionKey = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
