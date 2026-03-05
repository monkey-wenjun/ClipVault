import { emit } from "@tauri-apps/api/event";
import { message, open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { LISTEN_KEY } from "@/constants";
import { clipboardStore } from "@/stores/clipboard";
import { globalStore } from "@/stores/global";
import { imageHostingStore } from "@/stores/imageHosting";
import { deepAssign } from "./object";

interface ExportData {
  version: string;
  exportTime: string;
  app: string;
  globalStore: typeof globalStore;
  clipboardStore: typeof clipboardStore;
  imageHostingStore: typeof imageHostingStore;
}

/**
 * 导出所有配置
 */
export const exportAllConfig = async (): Promise<boolean> => {
  try {
    const filePath = await save({
      defaultPath: `clipvault-config-${new Date().toISOString().split("T")[0]}.json`,
      filters: [
        {
          extensions: ["json"],
          name: "ClipVault Config",
        },
      ],
    });

    if (!filePath) return false;

    const exportData: ExportData = {
      app: "ClipVault",
      clipboardStore: { ...clipboardStore },
      exportTime: new Date().toISOString(),
      globalStore: { ...globalStore },
      imageHostingStore: { ...imageHostingStore },
      version: "1.0.0",
    };

    // 移除敏感信息（如 env）
    // @ts-expect-error - 删除敏感字段
    delete exportData.globalStore.env;

    await writeTextFile(filePath, JSON.stringify(exportData, null, 2));
    return true;
  } catch {
    return false;
  }
};

/**
 * 导入所有配置
 */
export const importAllConfig = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const selected = await open({
      filters: [
        {
          extensions: ["json"],
          name: "ClipVault Config",
        },
      ],
      multiple: false,
    });

    if (!selected || typeof selected !== "string") {
      return { message: "未选择文件", success: false };
    }

    const content = await readTextFile(selected);
    const data: Partial<ExportData> = JSON.parse(content);

    // 验证数据格式
    if (!data.globalStore && !data.clipboardStore) {
      return { message: "无效的配置文件格式", success: false };
    }

    // 确认导入
    const confirmed = await message(
      "导入配置将覆盖当前所有设置，确定要继续吗？",
      {
        kind: "warning",
        title: "确认导入",
      },
    );

    if (!confirmed) {
      return { message: "已取消导入", success: false };
    }

    // 导入全局配置
    if (data.globalStore) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { env: _, ...rest } = data.globalStore;
      deepAssign(globalStore, rest);
    }

    // 导入剪贴板配置
    if (data.clipboardStore) {
      deepAssign(clipboardStore, data.clipboardStore);
    }

    // 导入图床配置
    if (data.imageHostingStore) {
      deepAssign(imageHostingStore, data.imageHostingStore);
    }

    // 通知其他窗口配置已变更
    await emit(LISTEN_KEY.STORE_CHANGED, {
      clipboardStore,
      globalStore,
    });

    return { message: "配置导入成功", success: true };
  } catch (error) {
    return { message: `导入失败: ${String(error)}`, success: false };
  }
};

/**
 * 重置所有配置为默认
 */
export const resetAllConfig = async (): Promise<boolean> => {
  const confirmed = await message(
    "重置将恢复所有设置为默认值，此操作不可撤销，确定要继续吗？",
    {
      kind: "warning",
      title: "确认重置",
    },
  );

  if (!confirmed) return false;

  // 重置全局配置
  globalStore.app.autoStart = true;
  globalStore.app.silentStart = true;
  globalStore.app.showMenubarIcon = true;
  globalStore.app.showTaskbarIcon = false;
  globalStore.appearance.theme = "auto";
  globalStore.appearance.isDark = false;
  globalStore.update.auto = false;
  globalStore.update.beta = false;
  globalStore.shortcut.clipboard = "CommandOrControl+Shift+V";
  globalStore.shortcut.preference = "Alt+X";
  globalStore.shortcut.pastePlain = "";
  globalStore.shortcut.imageHosting = "CommandOrControl+Shift+P";

  // 重置剪贴板配置
  clipboardStore.audio.copy = false;
  clipboardStore.content.autoPaste = "single";
  clipboardStore.content.copyPlain = false;
  clipboardStore.content.pastePlain = true;
  clipboardStore.content.deleteConfirm = true;
  clipboardStore.content.autoSort = false;
  clipboardStore.exclusion.apps = [];

  // 重置图床配置
  imageHostingStore.enabled = false;
  imageHostingStore.autoUpload = true;
  imageHostingStore.generateMarkdown = true;
  imageHostingStore.configs = [];
  imageHostingStore.defaultId = "";

  return true;
};
