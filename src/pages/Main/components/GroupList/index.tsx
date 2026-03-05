import { useKeyPress } from "ahooks";
import clsx from "clsx";
import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { DatabaseSchemaGroup } from "@/types/database";
import { scrollElementToCenter } from "@/utils/dom";
import { MainContext } from "../..";
import styles from "./index.module.scss";

const GroupList = () => {
  const { rootState } = useContext(MainContext);
  const { t } = useTranslation();

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
    const index = presetGroups.findIndex((item) => item.id === rootState.group);
    const length = presetGroups.length;
    const nextIndex = index === 0 ? length - 1 : index - 1;
    rootState.group = presetGroups[nextIndex].id;
  });

  useKeyPress("rightarrow", () => {
    const index = presetGroups.findIndex((item) => item.id === rootState.group);
    const length = presetGroups.length;
    const nextIndex = index === length - 1 ? 0 : index + 1;
    rootState.group = presetGroups[nextIndex].id;
  });

  return (
    <div className={styles.container} data-tauri-drag-region>
      {presetGroups.map((item) => {
        const { id, name, icon } = item;
        const isActive = id === rootState.group;

        return (
          <button
            className={clsx(styles.tab, isActive && styles.active)}
            data-tauri-drag-region
            id={id}
            key={id}
            onClick={() => {
              rootState.group = id;
            }}
            type="button"
          >
            <span className={styles.icon}>{icon}</span>
            <span className={styles.label}>{name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default GroupList;
