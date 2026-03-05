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

const TagBadge: FC<TagBadgeProps> = (props) => {
  const { tag, size = "small", removable, onRemove, onClick, className } = props;
  const { name, color } = tag;

  return (
    <span
      className={clsx(styles.tag, styles[size], className, {
        [styles.clickable]: onClick,
      })}
      style={{
        backgroundColor: `${color}20`,
        borderColor: `${color}40`,
        color: color,
      }}
      onClick={onClick}
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
        >
          ×
        </span>
      )}
    </span>
  );
};

export default TagBadge;
