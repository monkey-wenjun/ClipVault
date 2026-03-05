import { useBoolean, useMount } from "ahooks";
import { Button, Empty, Form, Input, List, Modal, message, Space } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import { addTag, loadTags, removeTag, tagStore, updateTag } from "@/stores/tag";
import type { DatabaseSchemaTag } from "@/types/database";
import styles from "./index.module.scss";

// 预设颜色
const PRESET_COLORS = [
  "#f5222d", // red
  "#fa541c", // orange
  "#fa8c16", // amber
  "#fadb14", // yellow
  "#a0d911", // lime
  "#52c41a", // green
  "#13c2c2", // cyan
  "#1890ff", // blue
  "#2f54eb", // indigo
  "#722ed1", // purple
  "#eb2f96", // pink
  "#8c8c8c", // gray
];

const Tags = () => {
  const { t } = useTranslation();
  const { tags } = useSnapshot(tagStore);
  const [isModalOpen, { setTrue: openModal, setFalse: closeModal }] =
    useBoolean(false);
  const [editingTag, setEditingTag] = useState<DatabaseSchemaTag | null>(null);
  const [form] = Form.useForm();
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(true);

  // 加载标签
  useMount(() => {
    const fetchTags = async () => {
      setLoading(true);
      await loadTags();
      setLoading(false);
    };
    fetchTags();
  });

  const handleAdd = () => {
    setEditingTag(null);
    form.resetFields();
    setSelectedColor(PRESET_COLORS[0]);
    openModal();
  };

  const handleEdit = (tag: DatabaseSchemaTag) => {
    setEditingTag(tag);
    form.setFieldsValue({ name: tag.name });
    setSelectedColor(tag.color);
    openModal();
  };

  const handleDelete = async (tag: DatabaseSchemaTag) => {
    Modal.confirm({
      content: t("preference.tags.label.delete_confirm_content", {
        name: tag.name,
      }),
      onOk: async () => {
        await removeTag(tag.id);
        message.success(t("preference.tags.label.delete_success"));
      },
      title: t("preference.tags.label.delete_confirm"),
    });
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const name = values.name.trim();

    if (!name) return;

    try {
      if (editingTag) {
        await updateTag(editingTag.id, { color: selectedColor, name });
        message.success(t("preference.tags.label.update_success"));
      } else {
        await addTag(name, selectedColor);
        message.success(t("preference.tags.label.create_success"));
      }
      closeModal();
    } catch {
      message.error(t("preference.tags.label.save_error"));
    }
  };

  return (
    <ProList
      header={
        <div className={styles.header}>
          <span>{t("preference.tags.title")}</span>
          <Button onClick={handleAdd} type="primary">
            {t("preference.tags.label.add_tag")}
          </Button>
        </div>
      }
    >
      {loading ? (
        <Empty
          description={t("preference.tags.label.loading")}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : tags.length === 0 ? (
        <Empty
          description={t("preference.tags.label.no_tags")}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          className={styles.tagList}
          dataSource={tags}
          renderItem={(tag) => (
            <List.Item
              actions={[
                <Button key="edit" onClick={() => handleEdit(tag)} type="link">
                  {t("preference.tags.label.edit")}
                </Button>,
                <Button
                  danger
                  key="delete"
                  onClick={() => handleDelete(tag)}
                  type="link"
                >
                  {t("preference.tags.label.delete")}
                </Button>,
              ]}
              className={styles.tagItem}
            >
              <div className={styles.tagDisplay}>
                <span
                  className={styles.tagDot}
                  style={{ backgroundColor: tag.color }}
                />
                <span className={styles.tagName}>{tag.name}</span>
              </div>
            </List.Item>
          )}
        />
      )}

      <Modal
        onCancel={closeModal}
        onOk={handleSubmit}
        open={isModalOpen}
        title={
          editingTag
            ? t("preference.tags.label.edit_tag")
            : t("preference.tags.label.add_tag")
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("preference.tags.label.tag_name")}
            name="name"
            rules={[
              {
                message: t("preference.tags.label.name_required"),
                required: true,
              },
            ]}
          >
            <Input
              autoFocus
              maxLength={20}
              placeholder={t("preference.tags.label.input_tag_name")}
              showCount
            />
          </Form.Item>
          <Form.Item label={t("preference.tags.label.tag_color")}>
            <Space size="small" wrap>
              {PRESET_COLORS.map((color) => (
                <button
                  className={styles.colorDot}
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    backgroundColor: color,
                    boxShadow:
                      selectedColor === color
                        ? `0 0 0 2px ${color}`
                        : undefined,
                  }}
                  type="button"
                />
              ))}
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </ProList>
  );
};

export default Tags;
