import { Flex, List, type ListProps } from "antd";
import type { FC } from "react";
import styles from "./index.module.scss";

const ProList: FC<ListProps<unknown>> = (props) => {
  const { header, children, bordered = true, ...rest } = props;

  return (
    <Flex className={styles.root} data-tauri-drag-region gap="small" vertical>
      {header && (
        <div className={styles.title} data-tauri-drag-region>
          <span>{header}</span>
        </div>
      )}

      <List bordered={bordered} {...rest}>
        {children}
      </List>
    </Flex>
  );
};

export default ProList;
