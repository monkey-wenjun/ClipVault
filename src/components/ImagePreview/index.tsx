import {
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { readFile } from "@tauri-apps/plugin-fs";
import { Button, Modal } from "antd";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { getDefaultSaveImagePath } from "tauri-plugin-clipboard-x-api";
import type { DatabaseSchemaHistory } from "@/types/database";
import { join } from "@/utils/path";
import styles from "./index.module.scss";

interface ImagePreviewProps {
  data: DatabaseSchemaHistory<"image"> | null;
  visible: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

const ImagePreview: FC<ImagePreviewProps> = (props) => {
  const { data, visible, onClose, onDelete } = props;
  const [imageSrc, setImageSrc] = useState<string>("");

  useEffect(() => {
    if (!data) return;

    const processSrc = async () => {
      const { value } = data;

      // 判断是否为网络 URL（图床图片）
      const isNetworkUrl =
        value.startsWith("http://") || value.startsWith("https://");

      if (isNetworkUrl) {
        setImageSrc(value);
        return;
      }

      // 判断是否为完整路径（以盘符开头或根路径）
      const isAbsolutePath =
        value.startsWith("/") ||
        value.startsWith("\\") ||
        /^[a-zA-Z]:/.test(value);

      let fullPath: string;
      if (isAbsolutePath) {
        // 已经是完整路径
        fullPath = value;
      } else {
        // 相对路径，需要拼接成完整路径
        const defaultPath = await getDefaultSaveImagePath();
        fullPath = join(defaultPath, value);
      }

      try {
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
  }, [data]);

  if (!data) return null;

  const handleDownload = () => {
    if (!imageSrc) return;

    // 创建下载链接
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = `image_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      centered
      className={styles.modal}
      closeIcon={<CloseOutlined className={styles.closeIcon} />}
      destroyOnClose
      footer={
        <div className={styles.footer}>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            type="primary"
          >
            下载
          </Button>
          {onDelete && (
            <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
              删除
            </Button>
          )}
        </div>
      }
      onCancel={onClose}
      open={visible}
      title="图片预览"
      width="auto"
    >
      <div className={styles.container}>
        {imageSrc ? (
          <img alt="预览图片" className={styles.image} src={imageSrc} />
        ) : (
          <div className="h-64 w-96 animate-pulse rounded bg-gray-800" />
        )}
      </div>
    </Modal>
  );
};

export default ImagePreview;
