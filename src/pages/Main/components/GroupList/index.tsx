import { useKeyPress, useMount, useRequest } from "ahooks";
import clsx from "clsx";
import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import type { DatabaseSchemaGroup, DatabaseSchemaTag } from "@/types/database";
import { scrollElementToCenter } from "@/utils/dom";
import { MainContext } from "../..";
import { tagStore, loadTags } from "@/stores/tag";
import TagBadge from "@/components/TagBadge";
import styles from "./index.module.scss";

const GroupList = () => {
  const { rootState } = useContext(MainContext);
  const { t } = useTranslation();
  const { tags, selectedTagId } = useSnapshot(tagStore);

  // 加载标签
  useMount(() => {
    loadTags();
  });

  useEffect(() => {
    scrollElementToCenter(rootState.group);
  }, [rootState.group]);

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
    const allItems = [...presetGroups, ...tags.map(t => ({ ...t, icon: "🏷️" }))];
    const index = allItems.findIndex((item) => item.id === rootState.group);
    const length = allItems.length;
    const nextIndex = index === 0 ? length - 1 : index - 1;
    const nextGroup = allItems[nextIndex];
    rootState.group = nextGroup.id;
    if ('color' in nextGroup) {
      tagStore.selectedTagId = nextGroup.id;
    } else {
      tagStore.selectedTagId = null;
    }
  });

  useKeyPress("rightarrow", () => {
    const allItems = [...presetGroups, ...tags.map(t => ({ ...t, icon: "🏷️" }))];
    const index = allItems.findIndex((item) => item.id === rootState.group);
    const length = allItems.length;
    const nextIndex = index === length - 1 ? 0 : index + 1;
    const nextGroup = allItems[nextIndex];
    rootState.group = nextGroup.id;
    if ('color' in nextGroup) {
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
            <TagBadge size="small" tag={tag} />
          </button>
        );
      })}
    </div>
  );
};

export default GroupList;
