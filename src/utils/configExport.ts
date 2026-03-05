import { open, save, message } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { emit } from "@tauri-apps/api/event";
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
			filters: [
				{
					name: "ClipVault Config",
					extensions: ["json"],
				},
			],
			defaultPath: `clipvault-config-${new Date().toISOString().split("T")[0]}.json`,
		});

		if (!filePath) return false;

		const exportData: ExportData = {
			version: "1.0.0",
			exportTime: new Date().toISOString(),
			app: "ClipVault",
			globalStore: { ...globalStore },
			clipboardStore: { ...clipboardStore },
			imageHostingStore: { ...imageHostingStore },
		};

		// 移除敏感信息（如 env）
		// @ts-expect-error - 删除敏感字段
		delete exportData.globalStore.env;

		await writeTextFile(filePath, JSON.stringify(exportData, null, 2));
		return true;
	} catch (error) {
		console.error("Export failed:", error);
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
					name: "ClipVault Config",
					extensions: ["json"],
				},
			],
			multiple: false,
		});

		if (!selected || typeof selected !== "string") {
			return { success: false, message: "未选择文件" };
		}

		const content = await readTextFile(selected);
		const data: Partial<ExportData> = JSON.parse(content);

		// 验证数据格式
		if (!data.globalStore && !data.clipboardStore) {
			return { success: false, message: "无效的配置文件格式" };
		}

		// 确认导入
		const confirmed = await message(
			"导入配置将覆盖当前所有设置，确定要继续吗？",
			{
				title: "确认导入",
				kind: "warning",
			},
		);

		if (!confirmed) {
			return { success: false, message: "已取消导入" };
		}

		// 导入全局配置
		if (data.globalStore) {
			const { env, ...rest } = data.globalStore;
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
			globalStore,
			clipboardStore,
		});

		return { success: true, message: "配置导入成功" };
	} catch (error) {
		console.error("Import failed:", error);
		return { success: false, message: `导入失败: ${String(error)}` };
	}
};

/**
 * 重置所有配置为默认
 */
export const resetAllConfig = async (): Promise<boolean> => {
	const confirmed = await message(
		"重置将恢复所有设置为默认值，此操作不可撤销，确定要继续吗？",
		{
			title: "确认重置",
			kind: "warning",
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

	// 重置图床配置
	imageHostingStore.enabled = false;
	imageHostingStore.autoUpload = true;
	imageHostingStore.generateMarkdown = true;
	imageHostingStore.configs = [];
	imageHostingStore.defaultId = "";

	return true;
};
