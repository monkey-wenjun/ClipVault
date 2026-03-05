import { useBoolean, useKeyPress, useMount } from "ahooks";
import clsx from "clsx";
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import { PRESET_COLORS } from "@/components/TagSelector";
import { addTag, loadTags, tagStore } from "@/stores/tag";
import type { DatabaseSchemaGroup, DatabaseSchemaTag } from "@/types/database";
import { scrollElementToCenter } from "@/utils/dom";
import { MainContext } from "../..";
import styles from "./index.module.scss";

// 预设颜色（循环使用）
const getRandomColor = () => {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
};

const GroupList = () => {
  const { rootState } = useContext(MainContext);
  const { t } = useTranslation();
  const { tags, selectedTagId } = useSnapshot(tagStore);
  const [isAdding, { setTrue: startAdding, setFalse: stopAdding }] =
    useBoolean(false);
  const [newTagName, setNewTagName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载标签
  useMount(() => {
    loadTags();
  });

  useEffect(() => {
    scrollElementToCenter(rootState.group);
  }, [rootState.group]);

  // 当开始添加时，聚焦输入框
  useEffect(() => {
    if (isAdding) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isAdding]);

  const presetGroups: DatabaseSchemaGroup[] = [
    {
      icon: "📋",
      id: "all",
      name: t("clipboard.label.tab.all"),
    },
    {
      icon: "⭐",
      id: "favorite",
      name: t("clipboard.label.tab.favorite"),
    },
    {
      icon: "📝",
      id: "text",
      name: t("clipboard.label.tab.text"),
    },
    {
      icon: "🖼️",
      id: "image",
      name: t("clipboard.label.tab.image"),
    },
    {
      icon: "📁",
      id: "files",
      name: t("clipboard.label.tab.files"),
    },
  ];

  // 左右箭头键切换分组
  useKeyPress("leftarrow", () => {
    const allItems = [
      ...presetGroups,
      ...tags.map((t) => ({ ...t, icon: "🏷️" })),
    ];
    const index = allItems.findIndex((item) => item.id === rootState.group);
    const length = allItems.length;
    const nextIndex = index === 0 ? length - 1 : index - 1;
    const nextGroup = allItems[nextIndex];
    rootState.group = nextGroup.id;
    if ("color" in nextGroup) {
      tagStore.selectedTagId = nextGroup.id;
    } else {
      tagStore.selectedTagId = null;
    }
  });

  useKeyPress("rightarrow", () => {
    const allItems = [
      ...presetGroups,
      ...tags.map((t) => ({ ...t, icon: "🏷️" })),
    ];
    const index = allItems.findIndex((item) => item.id === rootState.group);
    const length = allItems.length;
    const nextIndex = index === length - 1 ? 0 : index + 1;
    const nextGroup = allItems[nextIndex];
    rootState.group = nextGroup.id;
    if ("color" in nextGroup) {
      tagStore.selectedTagId = nextGroup.id;
    } else {
      tagStore.selectedTagId = null;
    }
  });

  const handlePresetGroupClick = (id: string) => {
    rootState.group = id;
    tagStore.selectedTagId = null;
  };

  const handleTagClick = (tag: DatabaseSchemaTag) => {
    rootState.group = "tag";
    tagStore.selectedTagId = tag.id;
  };

  // 处理创建新标签
  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) {
      stopAdding();
      return;
    }

    // 检查是否已存在同名标签
    const existing = tags.find((t) => t.name === name);
    if (existing) {
      // 如果已存在，直接选中
      handleTagClick(existing);
      setNewTagName("");
      stopAdding();
      return;
    }

    // 创建新标签
    const color = getRandomColor();
    const newTagId = await addTag(name, color);

    // 选中新创建的标签
    tagStore.selectedTagId = newTagId;
    rootState.group = "tag";

    setNewTagName("");
    stopAdding();
  };

  // 处理输入框按键
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateTag();
    } else if (e.key === "Escape") {
      stopAdding();
      setNewTagName("");
    }
  };

  // 处理输入框失去焦点
  const handleInputBlur = () => {
    if (newTagName.trim()) {
      handleCreateTag();
    } else {
      stopAdding();
    }
  };

  return (
    <div className={styles.container} data-tauri-drag-region>
      {/* 预设分组 */}
      {presetGroups.map((item) => {
        const { id, name, icon } = item;
        const isActive = id === rootState.group && !selectedTagId;

        return (
          <button
            className={clsx(styles.tab, isActive && styles.active)}
            data-tauri-drag-region
            id={id}
            key={id}
            onClick={() => handlePresetGroupClick(id)}
            type="button"
          >
            <span className={styles.icon}>{icon}</span>
            <span className={styles.label}>{name}</span>
          </button>
        );
      })}

      {/* 分隔线 */}
      {tags.length > 0 && <div className={styles.divider} />}

      {/* 自定义标签 */}
      {tags.map((tag) => {
        const isActive = tag.id === selectedTagId;

        return (
          <button
            className={clsx(styles.tagTab, isActive && styles.activeTagTab)}
            data-tauri-drag-region
            id={tag.id}
            key={tag.id}
            onClick={() => handleTagClick(tag)}
            type="button"
          >
            <span
              className={styles.tagDot}
              style={{ backgroundColor: tag.color }}
            />
            <span className={styles.tagName}>{tag.name}</span>
          </button>
        );
      })}

      {/* 添加标签按钮或输入框 - 始终在所有标签后面 */}
      {isAdding ? (
        <div className={styles.addTagInputWrapper}>
          <span className={styles.addTagIcon}>+</span>
          <input
            className={styles.addTagInput}
            maxLength={20}
            onBlur={handleInputBlur}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t("clipboard.label.tab.new_tag")}
            ref={inputRef}
            type="text"
            value={newTagName}
          />
        </div>
      ) : (
        <button
          className={styles.addTagButton}
          data-tauri-drag-region
          onClick={startAdding}
          title={t("clipboard.label.tab.add_tag")}
          type="button"
        >
          <span className={styles.addTagIcon}>+</span>
        </button>
      )}
    </div>
  );
};

export default GroupList;
