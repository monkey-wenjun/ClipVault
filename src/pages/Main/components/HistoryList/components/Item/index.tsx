import clsx from "clsx";
import type { FC } from "react";
import { useContext } from "react";
import { Marker } from "react-mark.js";
import { useSnapshot } from "valtio";
import SafeHtml from "@/components/SafeHtml";
import UnoIcon from "@/components/UnoIcon";
import { useContextMenu } from "@/hooks/useContextMenu";
import { MainContext } from "@/pages/Main";
import { pasteToClipboard } from "@/plugins/clipboard";
import { clipboardStore } from "@/stores/clipboard";
import type { DatabaseSchemaHistory } from "@/types/database";
import Files from "../Files";
import Image from "../Image";
import Rtf from "../Rtf";
import Text from "../Text";
import styles from "./index.module.scss";

export interface ItemProps {
  index: number;
  data: DatabaseSchemaHistory;
  deleteModal: any;
  handleNote: () => void;
}

const Item: FC<ItemProps> = (props) => {
  const { index, data } = props;
  const { id, type, note, favorite, count, createTime } = data;
  const { rootState } = useContext(MainContext);
  const { content } = useSnapshot(clipboardStore);
  const isActive = rootState.activeId === id;

  const handleNext = () => {
    const { list } = rootState;
    const nextItem = list[index + 1] ?? list[index - 1];
    rootState.activeId = nextItem?.id;
  };

  const { handleContextMenu } = useContextMenu({
    ...props,
    handleNext,
  });

  const handleClick = (clickType: typeof content.autoPaste) => {
    rootState.activeId = id;
    if (content.autoPaste !== clickType) return;
    pasteToClipboard(data);
  };

  const renderContent = () => {
    switch (type) {
      case "text":
        return <Text {...data} />;
      case "rtf":
        return <Rtf {...data} />;
      case "html":
        return <SafeHtml {...data} />;
      case "image":
        return <Image {...data} />;
      case "files":
        return <Files {...data} />;
    }
  };

  // 获取类型图标和颜色
  const getTypeInfo = () => {
    switch (type) {
      case "text":
        return { className: styles.text, icon: "📝", label: "文本" };
      case "image":
        return { className: styles.image, icon: "🖼️", label: "图片" };
      case "files":
        return { className: styles.file, icon: "📁", label: "文件" };
      case "rtf":
      case "html":
        return { className: styles.code, icon: "💻", label: "代码" };
      default:
        return { className: styles.text, icon: "📋", label: "文本" };
    }
  };

  const typeInfo = getTypeInfo();

  return (
    <div
      className={clsx(styles.card, isActive && styles.active)}
      onClick={() => handleClick("single")}
      onContextMenu={handleContextMenu}
      onDoubleClick={() => handleClick("double")}
    >
      {/* 序号标记 */}
      <span className={styles.key}>{index + 1}</span>

      {/* 卡片头部 */}
      <div className={styles.header}>
        <div className={clsx(styles.icon, typeInfo.className)}>
          {typeInfo.icon}
        </div>
        <span className={styles.title}>{typeInfo.label}</span>
        {favorite && <span className={styles.pin}>📌</span>}
      </div>

      {/* 卡片内容 */}
      <div className={styles.content}>
        {note && (
          <div className={styles.note}>
            <UnoIcon name="i-hugeicons:task-edit-01" />
            <Marker mark={rootState.search}>{note}</Marker>
          </div>
        )}
        <div
          className={clsx(
            styles.body,
            note && content.showOriginalContent && styles.faded,
          )}
        >
          {renderContent()}
        </div>
      </div>

      {/* 卡片底部 - 简洁的元信息 */}
      <div className={styles.footer}>
        <div className={styles.meta}>
          <span>{count} 字符</span>
          <span>·</span>
          <span>{new Date(createTime).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default Item;
