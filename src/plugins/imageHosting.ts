import { invoke } from "@tauri-apps/api/core";
import { writeText } from "tauri-plugin-clipboard-x-api";
import { getImage } from "@/database/image";
import { imageHostingStore } from "@/stores/imageHosting";
import type { ImageHostingConfig, UploadResult } from "@/types/imageHosting";

/**
 * 加密图床配置
 */
export const encryptConfig = async (
	config: ImageHostingConfig,
): Promise<ImageHostingConfig> => {
	return invoke("plugin:eco-image-hosting|encrypt_image_hosting_config", {
		config,
	});
};

/**
 * 解密图床配置
 */
export const decryptConfig = async (
	config: ImageHostingConfig,
): Promise<ImageHostingConfig> => {
	return invoke("plugin:eco-image-hosting|decrypt_image_hosting_config", {
		config,
	});
};

/**
 * 上传图片到指定图床
 */
export const uploadImage = async (
	imageData: Uint8Array,
	fileName: string,
	config: ImageHostingConfig,
): Promise<UploadResult> => {
	return invoke("plugin:eco-image-hosting|upload_image", {
		imageData: Array.from(imageData),
		fileName,
		config,
	});
};

/**
 * 上传图片到默认图床
 */
export const uploadImageToDefault = async (
	imageData: Uint8Array,
	fileName: string,
): Promise<UploadResult> => {
	const { configs, defaultId } = imageHostingStore;

	if (configs.length === 0) {
		return {
			success: false,
			error: "No image hosting configured",
		};
	}

	// 查找默认图床配置
	const defaultConfig = configs.find((c) => c.id === defaultId) || configs[0];

	if (!defaultConfig) {
		return {
			success: false,
			error: "Default image hosting not found",
		};
	}

	return uploadImage(imageData, fileName, defaultConfig);
};

/**
 * 上传最新的图片到图床
 */
export const uploadLatestImage = async (): Promise<UploadResult> => {
	if (!imageHostingStore.enabled || imageHostingStore.configs.length === 0) {
		return {
			success: false,
			error: "Image hosting not enabled or not configured",
		};
	}

	try {
		// 获取最新的图片
		const latestImage = await getImage();

		if (!latestImage) {
			return {
				success: false,
				error: "No image found in clipboard history",
			};
		}

		// 读取图片文件
		const response = await fetch(latestImage.value);
		const blob = await response.blob();
		const arrayBuffer = await blob.arrayBuffer();
		const imageData = new Uint8Array(arrayBuffer);

		// 生成文件名
		const fileName = generateFileName(latestImage.value);

		// 上传到图床
		const result = await uploadImageToDefault(imageData, fileName);

		if (result.success && result.url) {
			// 如果启用 Markdown 生成，写入剪贴板
			if (
				imageHostingStore.generateMarkdown &&
				result.markdownUrl
			) {
				await writeText(result.markdownUrl);
			} else if (result.url) {
				await writeText(result.url);
			}
		}

		return result;
	} catch (error) {
		console.error("Upload latest image failed:", error);
		return {
			success: false,
			error: String(error),
		};
	}
};

/**
 * 生成唯一的文件名
 */
export const generateFileName = (originalName: string): string => {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	const ext = originalName.split(".").pop() || "png";
	return `clip_${timestamp}_${random}.${ext}`;
};

/**
 * 生成 Markdown 图片链接
 */
export const generateMarkdownImage = (url: string, alt = "image"): string => {
	return `![${alt}](${url})`;
};
