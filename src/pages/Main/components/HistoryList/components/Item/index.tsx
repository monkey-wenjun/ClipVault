import clsx from "clsx";
import type { FC } from "react";
import { memo, useContext, useEffect, useState } from "react";
import { Marker } from "react-mark.js";
import { useSnapshot } from "valtio";
import SafeHtml from "@/components/SafeHtml";
import TagBadge from "@/components/TagBadge";
import UnoIcon from "@/components/UnoIcon";
import { getHistoryTags } from "@/database/tag";
import { useContextMenu } from "@/hooks/useContextMenu";
import { MainContext } from "@/pages/Main";
import { pasteToClipboard } from "@/plugins/clipboard";
import { clipboardStore } from "@/stores/clipboard";
import type {
  DatabaseSchemaHistory,
  DatabaseSchemaTag,
} from "@/types/database";
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
  handleTag?: () => void;
  handlePreviewImage?: () => void;
  isSelected: boolean;
  isActive: boolean;
  search?: string;
}

const Item: FC<ItemProps> = (props) => {
  const {
    index,
    data,
    deleteModal: _deleteModal,
    handleNote: _handleNote,
    handleTag: _handleTag,
    isSelected,
    isActive,
    search,
  } = props;
  const { id, type, note, favorite, count, createTime } = data;
  const { rootState } = useContext(MainContext);
  const { content } = useSnapshot(clipboardStore);
  const [tags, setTags] = useState<DatabaseSchemaTag[]>([]);

  // 加载历史记录的标签
  useEffect(() => {
    const loadTags = async () => {
      const historyTags = await getHistoryTags(id);
      setTags(historyTags);
    };
    loadTags();
  }, [id]);

  const handleNext = () => {
    const { list } = rootState;
    const nextItem = list[index + 1] ?? list[index - 1];
    rootState.activeId = nextItem?.id;
  };

  const handlePreviewImage = () => {
    if (type !== "image") return;
    props.handlePreviewImage?.();
  };

  const { handleContextMenu } = useContextMenu({
    ...props,
    handleNext,
    handlePreviewImage,
    onTagsChange: setTags,
    tags,
  });

  const handleClick = (
    clickType: typeof content.autoPaste,
    event?: React.MouseEvent,
  ) => {
    // Ctrl+Click 切换选中状态
    if (event?.ctrlKey || event?.metaKey) {
      const selectedIndex = rootState.selectedIds.indexOf(id);
      if (selectedIndex === -1) {
        rootState.selectedIds.push(id);
      } else {
        rootState.selectedIds.splice(selectedIndex, 1);
      }
      rootState.activeId = id;
      return;
    }

    // Shift+Click 范围选择
    if (event?.shiftKey) {
      const { list, selectedIds } = rootState;
      if (selectedIds.length === 0) {
        // 如果没有选中项，只选中当前项
        rootState.selectedIds = [id];
      } else {
        // 找到最后一个选中项的索引
        const lastSelectedId = selectedIds[selectedIds.length - 1];
        const lastIndex = list.findIndex((item) => item.id === lastSelectedId);
        const currentIndex = index;

        if (lastIndex !== -1) {
          // 选择从 lastIndex 到 currentIndex 之间的所有项
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          const rangeIds = list.slice(start, end + 1).map((item) => item.id);

          // 合并已选中的和范围选择的（去重）
          const newSelectedIds = [...new Set([...selectedIds, ...rangeIds])];
          rootState.selectedIds = newSelectedIds;
        }
      }
      rootState.activeId = id;
      return;
    }

    // 普通点击：如果有选中项，清空选中；否则只设置 activeId
    if (rootState.selectedIds.length > 0) {
      rootState.selectedIds = [];
    }

    rootState.activeId = id;
    if (content.autoPaste !== clickType) return;
    pasteToClipboard(data);
  };

  // 测试删除功能 - Alt+双击删除
  const handleDoubleClickTest = (e: React.MouseEvent) => {
    if (e.altKey) {
      // console.log("[Item] Alt+DoubleClick delete test, id:", id);
      rootState.list = rootState.list.filter((item) => item.id !== id);
      // console.log("[Item] after delete, list length:", rootState.list.length);
    }
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
      className={clsx(
        styles.card,
        isActive && styles.active,
        isSelected && styles.selected,
      )}
      onClick={(e) => handleClick("single", e)}
      onContextMenu={(e) => {
        // console.log("[Item] onContextMenu triggered, id:", id);
        handleContextMenu(e);
      }}
      onDoubleClick={(e) => {
        handleClick("double", e);
        handleDoubleClickTest(e);
      }}
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
            <Marker mark={search}>{note}</Marker>
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

      {/* 标签显示 */}
      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map((tag) => (
            <TagBadge key={tag.id} size="small" tag={tag} />
          ))}
        </div>
      )}

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

export default memo(Item, (prevProps, nextProps) => {
  // 自定义比较函数，只在必要时重渲染
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.index === nextProps.index &&
    prevProps.search === nextProps.search &&
    prevProps.data.id === nextProps.data.id &&
    prevProps.data.favorite === nextProps.data.favorite &&
    prevProps.data.note === nextProps.data.note
  );
});
