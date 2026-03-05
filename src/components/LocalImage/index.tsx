import { exists, readFile } from "@tauri-apps/plugin-fs";
import type { FC, HTMLAttributes } from "react";
import { useEffect, useState } from "react";
import { getDefaultSaveImagePath } from "tauri-plugin-clipboard-x-api";
import { join } from "@/utils/path";

interface LocalImage extends HTMLAttributes<HTMLImageElement> {
  src: string;
}

const LocalImage: FC<LocalImage> = (props) => {
  const { src, ...rest } = props;
  const [imageSrc, setImageSrc] = useState<string>("");

  useEffect(() => {
    const processSrc = async () => {
      // 判断是否为网络 URL（图床图片）
      const isNetworkUrl =
        src.startsWith("http://") || src.startsWith("https://");

      if (isNetworkUrl) {
        setImageSrc(src);
        return;
      }

      // 判断是否为完整路径（以盘符开头或根路径）
      const isAbsolutePath =
        src.startsWith("/") || src.startsWith("\\") || /^[a-zA-Z]:/.test(src);

      let fullPath: string;
      if (isAbsolutePath) {
        // 已经是完整路径
        fullPath = src;
      } else {
        // 相对路径，需要拼接成完整路径
        const defaultPath = await getDefaultSaveImagePath();
        fullPath = join(defaultPath, src);
      }

      try {
        // 先检查文件是否存在
        const fileExists = await exists(fullPath);
        if (!fileExists) {
          // 等待一段时间后重试（可能是文件还未写入磁盘）
          await new Promise((resolve) => setTimeout(resolve, 500));
          const retryExists = await exists(fullPath);
          if (!retryExists) {
            return;
          }
        }

        // 读取文件内容为二进制
        const fileData = await readFile(fullPath);
        // 创建 Blob 对象
        const blob = new Blob([fileData], { type: "image/png" });
        // 创建临时 URL
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      } catch (_error) {}
    };

    processSrc();

    // 清理函数：释放 Blob URL
    return () => {
      if (imageSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  if (!imageSrc) {
    return <div className="h-20 w-full animate-pulse rounded bg-gray-200" />;
  }

  return <img {...rest} src={imageSrc} />;
};

export default LocalImage;
