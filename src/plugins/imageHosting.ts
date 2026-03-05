import { invoke } from "@tauri-apps/api/core";
import type { ImageHostingConfig, UploadResult } from "@/types/imageHosting";

export const uploadImage = async (
	imageData: Uint8Array,
	fileName: string,
	config?: ImageHostingConfig,
): Promise<UploadResult> => {
	return invoke("plugin:eco-image-hosting|upload_image", {
		imageData: Array.from(imageData),
		fileName,
		config,
	});
};

export const uploadImageToDefault = async (
	imageData: Uint8Array,
	fileName: string,
): Promise<UploadResult> => {
	return invoke("plugin:eco-image-hosting|upload_image_to_default", {
		imageData: Array.from(imageData),
		fileName,
	});
};

export const generateFileName = (originalName: string): string => {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	const ext = originalName.split(".").pop() || "png";
	return `clip_${timestamp}_${random}.${ext}`;
};

export const generateMarkdownImage = (url: string, alt = "image"): string => {
	return `![${alt}](${url})`;
};
