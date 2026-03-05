import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { imageHostingStore } from "@/stores/imageHosting";
import type { ImageHostingConfig } from "@/types/imageHosting";

/**
 * 导出图床配置到文件
 */
export const exportImageHostingConfig = async (): Promise<boolean> => {
  try {
    const filePath = await save({
      defaultPath: "clipvault-image-hosting-config.json",
      filters: [
        {
          extensions: ["json"],
          name: "JSON",
        },
      ],
    });

    if (!filePath) return false;

    const configData = {
      configs: imageHostingStore.configs,
      defaultId: imageHostingStore.defaultId,
      exportTime: new Date().toISOString(),
      version: "1.0",
    };

    await writeTextFile(filePath, JSON.stringify(configData, null, 2));
    return true;
  } catch (_error) {
    return false;
  }
};

/**
 * 从文件导入图床配置
 */
export const importImageHostingConfig = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const selected = await open({
      filters: [
        {
          extensions: ["json"],
          name: "JSON",
        },
      ],
      multiple: false,
    });

    if (!selected || typeof selected !== "string") {
      return { message: "No file selected", success: false };
    }

    const content = await readTextFile(selected);
    const data = JSON.parse(content);

    // 验证数据格式
    if (!data.configs || !Array.isArray(data.configs)) {
      return { message: "Invalid config file format", success: false };
    }

    // 导入配置
    imageHostingStore.configs = data.configs as ImageHostingConfig[];
    if (data.defaultId) {
      imageHostingStore.defaultId = data.defaultId;
    }

    return {
      message: `Imported ${data.configs.length} configurations`,
      success: true,
    };
  } catch (error) {
    return { message: String(error), success: false };
  }
};

/**
 * 导出为环境变量格式（用于其他工具）
 */
export const exportAsEnv = async (): Promise<boolean> => {
  try {
    const filePath = await save({
      defaultPath: "clipvault-image-hosting.env",
      filters: [
        {
          extensions: ["env", "txt"],
          name: "Environment",
        },
      ],
    });

    if (!filePath) return false;

    const defaultConfig =
      imageHostingStore.configs.find(
        (c) => c.id === imageHostingStore.defaultId,
      ) || imageHostingStore.configs[0];

    if (!defaultConfig) {
      return false;
    }

    const envContent = `# ClipVault Image Hosting Config
# Provider: ${defaultConfig.provider}
# Exported at: ${new Date().toISOString()}

IMAGE_HOSTING_PROVIDER=${defaultConfig.provider}
IMAGE_HOSTING_ACCESS_KEY=${defaultConfig.accessKey}
IMAGE_HOSTING_SECRET_KEY=${defaultConfig.secretKey}
IMAGE_HOSTING_BUCKET=${defaultConfig.bucket}
IMAGE_HOSTING_REGION=${defaultConfig.region}
IMAGE_HOSTING_CUSTOM_DOMAIN=${defaultConfig.customDomain || ""}
IMAGE_HOSTING_PATH_PREFIX=${defaultConfig.pathPrefix || ""}
`;

    await writeTextFile(filePath, envContent);
    return true;
  } catch (_error) {
    return false;
  }
};
