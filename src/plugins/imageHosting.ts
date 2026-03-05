import { invoke } from "@tauri-apps/api/core";
import { readFile } from "@tauri-apps/plugin-fs";
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { readImage, writeText } from "tauri-plugin-clipboard-x-api";
import { i18n } from "@/locales";
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
    config,
    fileName,
    imageData: Array.from(imageData),
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
      error: "No image hosting configured",
      success: false,
    };
  }

  // 查找默认图床配置
  const defaultConfig = configs.find((c) => c.id === defaultId) || configs[0];

  if (!defaultConfig) {
    return {
      error: "Default image hosting not found",
      success: false,
    };
  }

  return uploadImage(imageData, fileName, defaultConfig);
};

/**
 * 发送系统通知（使用 Tauri 原生通知）
 */
const sendNotification = async (title: string, body: string) => {
  try {
    // 检查通知权限
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    if (permissionGranted) {
      // 调用 Rust 命令发送通知
      await invoke("send_notification", { body, title });
    }
  } catch {
    // 忽略通知发送失败
  }
};

/**
 * 上传最新的图片到图床
 */
export const uploadLatestImage = async (): Promise<UploadResult> => {
  const { t } = i18n;

  if (!imageHostingStore.enabled || imageHostingStore.configs.length === 0) {
    const error = "Image hosting not enabled or not configured";
    await sendNotification(t("notification.image_hosting.error_title"), error);
    return { error, success: false };
  }

  try {
    // 直接从剪贴板读取图片
    const imageInfo = await readImage();

    if (!imageInfo || !imageInfo.path) {
      const error = "No image found in clipboard";
      await sendNotification(
        t("notification.image_hosting.error_title"),
        error,
      );
      return { error, success: false };
    }

    // 使用 Tauri fs API 读取文件内容
    const imageData = await readFile(imageInfo.path);

    // 生成文件名
    const fileName = generateFileName(imageInfo.path);

    // 上传到图床
    const result = await uploadImageToDefault(imageData, fileName);

    if (result.success && result.url) {
      // 默认使用 Markdown 格式写入剪贴板
      const markdownUrl =
        result.markdownUrl || generateMarkdownImage(result.url, fileName);
      await writeText(markdownUrl);

      // 发送系统通知 - 成功
      await sendNotification(
        t("notification.image_hosting.success_title"),
        `${t("notification.image_hosting.success_body")}: ${markdownUrl.substring(0, 50)}...`,
      );
    } else {
      // 发送系统通知 - 失败
      await sendNotification(
        t("notification.image_hosting.error_title"),
        result.error || t("notification.image_hosting.unknown_error"),
      );
    }

    return result;
  } catch (error) {
    const errorMsg = String(error);
    // 发送系统通知 - 异常
    await sendNotification(
      t("notification.image_hosting.error_title"),
      errorMsg,
    );
    return {
      error: errorMsg,
      success: false,
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
