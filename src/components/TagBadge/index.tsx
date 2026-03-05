import clsx from "clsx";
import type { FC } from "react";
import type { DatabaseSchemaTag } from "@/types/database";
import styles from "./index.module.scss";

export interface TagBadgeProps {
  tag: DatabaseSchemaTag;
  size?: "small" | "medium" | "large";
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

// 计算对比色（黑白）
const getContrastColor = (hexColor: string) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

// 将十六进制颜色转换为 rgba
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const TagBadge: FC<TagBadgeProps> = (props) => {
  const {
    tag,
    size = "small",
    removable,
    onRemove,
    onClick,
    className,
  } = props;
  const { name, color } = tag;

  const textColor = getContrastColor(color);
  const bgColor = hexToRgba(color, 0.15);
  const borderColor = hexToRgba(color, 0.3);

  return (
    <span
      className={clsx(styles.tag, styles[size], className, {
        [styles.clickable]: onClick,
      })}
      onClick={onClick}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        color: textColor,
      }}
    >
      <span className={styles.dot} style={{ backgroundColor: color }} />
      <span className={styles.name}>{name}</span>
      {removable && (
        <span
          className={styles.remove}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          style={{ color: textColor }}
        >
          ×
        </span>
      )}
    </span>
  );
};

export default TagBadge;
