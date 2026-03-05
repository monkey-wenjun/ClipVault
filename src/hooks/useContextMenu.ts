import { Menu, MenuItem, type MenuItemOptions } from "@tauri-apps/api/menu";
import { downloadDir } from "@tauri-apps/api/path";
import { copyFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { openUrl, revealItemInDir } from "@tauri-apps/plugin-opener";
import { find, isArray, remove } from "es-toolkit/compat";
import { type MouseEvent, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import { deleteHistory, updateHistory } from "@/database/history";
import type { DatabaseSchemaTag } from "@/types/database";
import { MainContext } from "@/pages/Main";
import type { ItemProps } from "@/pages/Main/components/HistoryList/components/Item";
import { pasteToClipboard, writeToClipboard } from "@/plugins/clipboard";
import { clipboardStore } from "@/stores/clipboard";
import { globalStore } from "@/stores/global";
import { isMac } from "@/utils/is";
import { join } from "@/utils/path";

interface UseContextMenuProps extends ItemProps {
  handleNext: () => void;
  tags?: DatabaseSchemaTag[];
  onTagsChange?: (tags: DatabaseSchemaTag[]) => void;
}

interface ContextMenuItem extends MenuItemOptions {
  hide?: boolean;
}

export const useContextMenu = (props: UseContextMenuProps) => {
  const { data, deleteModal, handleNote, handleTag, handleNext, tags = [], onTagsChange } = props;
  const { id, type, value, group, favorite, subtype } = data;
  const { t } = useTranslation();
  const { env } = useSnapshot(globalStore);
  const { rootState } = useContext(MainContext);

  const pasteAsText = () => {
    return pasteToClipboard(data, true);
  };

  const handleFavorite = async () => {
    const nextFavorite = !favorite;

    const matched = find(rootState.list, { id });

    if (!matched) return;

    matched.favorite = nextFavorite;

    updateHistory(id, { favorite: nextFavorite });
  };

  const openToBrowser = () => {
    if (type !== "text") return;

    const url = value.startsWith("http") ? value : `http://${value}`;

    openUrl(url);
  };

  const exportToFile = async () => {
    if (isArray(value)) return;

    const extname = type === "text" ? "txt" : type;
    const fileName = `${env.appName}_${id}.${extname}`;
    const path = join(await downloadDir(), fileName);

    await writeTextFile(path, value);

    revealItemInDir(path);
  };

  const downloadImage = async () => {
    if (type !== "image") return;

    const fileName = `${env.appName}_${id}.png`;
    const path = join(await downloadDir(), fileName);

    await copyFile(value, path);

    revealItemInDir(path);
  };

  const openToFinder = () => {
    if (type === "text") {
      return revealItemInDir(value);
    }

    const [file] = value;

    revealItemInDir(file);
  };

  const handleDelete = () => {
    console.log("[handleDelete] called, id:", id);
    
    if (id === rootState.activeId) {
      handleNext();
    }

    // 先从列表移除（更新UI）- 使用 filter 创建新数组触发响应式更新
    console.log("[handleDelete] filtering list, current length:", rootState.list.length);
    const newList = rootState.list.filter((item) => item.id !== id);
    console.log("[handleDelete] new list length:", newList.length);
    rootState.list = newList;
    console.log("[handleDelete] after assignment, rootState.list.length:", rootState.list.length);

    // 后台异步删除数据库和文件
    deleteHistory(data).catch(console.error);
  };

  const handleManageTags = () => {
    handleTag?.();
  };

  const handleContextMenu = async (event: MouseEvent) => {
    event.preventDefault();

    rootState.activeId = id;

    const items: ContextMenuItem[] = [
      {
        action: () => writeToClipboard(data),
        text: t("clipboard.button.context_menu.copy"),
      },
      {
        action: handleNote,
        text: t("clipboard.button.context_menu.note"),
      },
      {
        action: handleManageTags,
        text: t("clipboard.button.context_menu.tags"),
      },
      {
        action: pasteAsText,
        hide: type !== "html" && type !== "rtf",
        text: t("clipboard.button.context_menu.paste_as_plain_text"),
      },
      {
        action: pasteAsText,
        hide: type !== "files",
        text: t("clipboard.button.context_menu.paste_as_path"),
      },
      {
        action: handleFavorite,
        text: favorite
          ? t("clipboard.button.context_menu.unfavorite")
          : t("clipboard.button.context_menu.favorite"),
      },
      {
        action: openToBrowser,
        hide: subtype !== "url",
        text: t("clipboard.button.context_menu.open_in_browser"),
      },
      {
        action: () => openUrl(`mailto:${value}`),
        hide: subtype !== "email",
        text: t("clipboard.button.context_menu.send_email"),
      },
      {
        action: exportToFile,
        hide: group !== "text",
        text: t("clipboard.button.context_menu.export_as_file"),
      },
      {
        action: downloadImage,
        hide: type !== "image",
        text: t("clipboard.button.context_menu.download_image"),
      },
      {
        action: openToFinder,
        hide: type !== "files" && subtype !== "path",
        text: isMac
          ? t("clipboard.button.context_menu.show_in_finder")
          : t("clipboard.button.context_menu.show_in_file_explorer"),
      },
      {
        action: () => {
          console.log("[delete] clicked");
          handleDelete();
        },
        text: t("clipboard.button.context_menu.delete"),
      },
    ];

    const filteredItems = items.filter(({ hide }) => !hide);
    console.log("[contextMenu] filtered items count:", filteredItems.length);
    
    const menuItems = await Promise.all(
      filteredItems.map((item) => {
        console.log("[contextMenu] creating menu item:", item.text);
        return MenuItem.new(item);
      })
    );

    const menu = await Menu.new({ items: menuItems });
    console.log("[contextMenu] menu created, popping up");
    menu.popup();
  };

  return {
    handleContextMenu,
    handleDelete,
    handleFavorite,
  };
};
