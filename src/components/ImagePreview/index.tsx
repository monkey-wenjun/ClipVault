import {
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { Button, Modal } from "antd";
import type { FC } from "react";
import type { DatabaseSchemaHistory } from "@/types/database";
import styles from "./index.module.scss";

interface ImagePreviewProps {
  data: DatabaseSchemaHistory<"image"> | null;
  visible: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

const ImagePreview: FC<ImagePreviewProps> = (props) => {
  const { data, visible, onClose, onDelete } = props;

  if (!data) return null;

  const { value } = data;

  const handleDownload = () => {
    // 创建下载链接
    const link = document.createElement("a");
    link.href = value;
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
        <img alt="预览图片" className={styles.image} src={value} />
      </div>
    </Modal>
  );
};

export default ImagePreview;
