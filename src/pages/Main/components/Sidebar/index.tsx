import clsx from "clsx";
import { filesize } from "filesize";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import UnoIcon from "@/components/UnoIcon";
import { MainContext } from "@/pages/Main";
import { pasteToClipboard, writeToClipboard } from "@/plugins/clipboard";
import { dayjs } from "@/utils/dayjs";
import styles from "./index.module.scss";

const Sidebar = () => {
  const { rootState } = useContext(MainContext);
  const { t, i18n } = useTranslation();

  const { list, activeId } = rootState;
  const activeItem = list.find((item) => item.id === activeId);

  if (!activeItem) {
    return (
      <div className={styles.sidebar} data-tauri-drag-region>
        <div className={styles.empty}>
          <UnoIcon
            className={styles.emptyIcon}
            name="i-lucide:clipboard-list"
          />
          <p>选择一项查看详情</p>
        </div>
      </div>
    );
  }

  const { type, value, count, createTime, favorite, note } = activeItem;

  const handlePaste = () => {
    pasteToClipboard(activeItem);
  };

  const handlePastePlain = () => {
    pasteToClipboard(activeItem, true);
  };

  const handleCopy = () => {
    writeToClipboard(activeItem);
  };

  const renderTypeLabel = () => {
    switch (type) {
      case "text":
        return t("clipboard.label.plain_text");
      case "rtf":
        return t("clipboard.label.rtf");
      case "html":
        return t("clipboard.label.html");
      case "image":
        return t("clipboard.label.image");
      case "files":
        return t("clipboard.label.n_files", { replace: [value.length] });
      default:
        return type;
    }
  };

  const renderSize = () => {
    if (type === "files" || type === "image") {
      return filesize(count, { standard: "jedec" });
    }
    return t("clipboard.label.n_chars", { replace: [count] });
  };

  // 从 value 中获取图片尺寸（如果是图片类型）
  const renderDimensions = () => {
    if (type !== "image") return null;
    // 图片尺寸可以从 data 中获取，这里简化为不显示
    return null;
  };

  return (
    <div className={styles.sidebar} data-tauri-drag-region>
      {/* 选中项信息 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>选中项</div>
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>类型</span>
            <span className={styles.infoValue}>{renderTypeLabel()}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>大小</span>
            <span className={styles.infoValue}>{renderSize()}</span>
          </div>
          {renderDimensions()}
          {note && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>备注</span>
              <span className={styles.infoValue}>{note}</span>
            </div>
          )}
        </div>
      </div>

      {/* 来源信息 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>来源</div>
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>时间</span>
            <span className={styles.infoValue}>
              {dayjs(createTime).locale(i18n.language).fromNow()}
            </span>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className={clsx(styles.section, styles.actionsSection)}>
        <div className={styles.sectionTitle}>快捷操作</div>
        <div className={styles.actions}>
          <button
            className={clsx(styles.actionBtn, styles.primary)}
            onClick={handlePaste}
            type="button"
          >
            <UnoIcon name="i-lucide:clipboard-copy" />
            <span>粘贴</span>
            <span className={styles.key}>↵</span>
          </button>

          <button
            className={styles.actionBtn}
            onClick={handlePastePlain}
            type="button"
          >
            <UnoIcon name="i-lucide:file-text" />
            <span>纯文本</span>
            <span className={styles.key}>⇧↵</span>
          </button>

          <button
            className={styles.actionBtn}
            onClick={handleCopy}
            type="button"
          >
            <UnoIcon name="i-lucide:copy" />
            <span>复制</span>
            <span className={styles.key}>⌘C</span>
          </button>

          <button className={styles.actionBtn} type="button">
            <UnoIcon
              className={favorite ? styles.favorite : ""}
              name={favorite ? "i-lucide:star" : "i-lucide:star-off"}
            />
            <span>{favorite ? "已收藏" : "收藏"}</span>
            <span className={styles.key}>P</span>
          </button>

          <button className={styles.actionBtn} type="button">
            <UnoIcon name="i-lucide:trash-2" />
            <span>删除</span>
            <span className={styles.key}>Del</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
