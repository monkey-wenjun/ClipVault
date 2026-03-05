import { useBoolean, useRequest } from "ahooks";
import { Button, Empty, Form, Input, Modal, Space } from "antd";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import TagBadge from "@/components/TagBadge";
import { tagStore } from "@/stores/tag";
import styles from "./index.module.scss";

// 预设颜色
export const PRESET_COLORS = [
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

export interface TagSelectorRef {
  open: (historyId: string, currentTagIds: string[]) => void;
}

const TagSelector = forwardRef<TagSelectorRef>((_, ref) => {
  const { t } = useTranslation();
  const [open, { toggle }] = useBoolean();
  const { tags } = useSnapshot(tagStore);
  const [historyId, setHistoryId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [showAddForm, { toggle: toggleAddForm, setFalse: hideAddForm }] =
    useBoolean(false);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  useImperativeHandle(ref, () => ({
    open: (id: string, currentTagIds: string[]) => {
      setHistoryId(id);
      setSelectedTagIds(currentTagIds);
      toggle();
    },
  }));

  // 加载标签
  useRequest(
    async () => {
      const { loadTags } = await import("@/stores/tag");
      await loadTags();
    },
    { ready: open },
  );

  const handleToggleTag = async (tagId: string) => {
    const isSelected = selectedTagIds.includes(tagId);
    const { addTagToHistory, removeTagFromHistory } = await import(
      "@/database/tag"
    );

    if (isSelected) {
      await removeTagFromHistory(historyId, tagId);
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      await addTagToHistory(historyId, tagId);
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    const values = form.getFieldsValue();
    if (!values.name?.trim()) return;

    const { addTag } = await import("@/stores/tag");
    const newTagId = await addTag(values.name.trim(), selectedColor);

    // 自动选中新创建的标签
    const { addTagToHistory } = await import("@/database/tag");
    await addTagToHistory(historyId, newTagId);
    setSelectedTagIds([...selectedTagIds, newTagId]);

    form.resetFields();
    hideAddForm();
  };

  const isSelected = (tagId: string) => selectedTagIds.includes(tagId);

  return (
    <Modal
      centered
      footer={null}
      onCancel={toggle}
      open={open}
      title={t("component.tag_selector.label.select_tags")}
      width={420}
    >
      <div className={styles.container}>
        {/* 已选标签 */}
        {selectedTagIds.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              {t("component.tag_selector.label.selected")}
            </div>
            <Space size="small" wrap>
              {selectedTagIds.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <TagBadge
                    key={tagId}
                    onRemove={() => handleToggleTag(tagId)}
                    removable
                    tag={tag}
                  />
                );
              })}
            </Space>
          </div>
        )}

        {/* 所有标签 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            {t("component.tag_selector.label.all_tags")}
          </div>
          {tags.length === 0 ? (
            <Empty
              description={t("component.tag_selector.label.no_tags")}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Space size="small" wrap>
              {tags.map((tag) => (
                <TagBadge
                  className={
                    isSelected(tag.id) ? styles.selected : styles.unselected
                  }
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.id)}
                  tag={tag}
                />
              ))}
            </Space>
          )}
        </div>

        {/* 添加新标签 */}
        {showAddForm ? (
          <div className={styles.addForm}>
            <Form form={form} layout="vertical">
              <Form.Item
                label={t("component.tag_selector.label.tag_name")}
                name="name"
                rules={[
                  {
                    message: t("component.tag_selector.label.name_required"),
                    required: true,
                  },
                ]}
              >
                <Input
                  autoFocus
                  maxLength={20}
                  placeholder={t("component.tag_selector.label.input_tag_name")}
                  showCount
                />
              </Form.Item>
              <Form.Item label={t("component.tag_selector.label.tag_color")}>
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
            <Space>
              <Button onClick={toggleAddForm}>
                {t("component.tag_selector.label.cancel")}
              </Button>
              <Button onClick={handleCreateTag} type="primary">
                {t("component.tag_selector.label.create")}
              </Button>
            </Space>
          </div>
        ) : (
          <Button block icon="+" onClick={toggleAddForm} type="dashed">
            {t("component.tag_selector.label.add_new_tag")}
          </Button>
        )}
      </div>
    </Modal>
  );
});

export default TagSelector;
