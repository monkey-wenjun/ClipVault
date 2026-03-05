import { proxy } from "valtio";
import type { DatabaseSchemaTag } from "@/types/database";

export interface TagStore {
  tags: DatabaseSchemaTag[];
  selectedTagId: string | null;
}

export const tagStore = proxy<TagStore>({
  selectedTagId: null,
  tags: [],
});

// 加载标签列表
export const loadTags = async () => {
  const { selectTags } = await import("@/database/tag");
  tagStore.tags = await selectTags();
};

// 添加标签
export const addTag = async (name: string, color: string) => {
  const { insertTag } = await import("@/database/tag");
  const id = crypto.randomUUID();
  const createTime = new Date().toISOString();

  await insertTag({ color, createTime, id, name });
  await loadTags();

  return id;
};

// 更新标签
export const updateTag = async (
  id: string,
  updates: Partial<DatabaseSchemaTag>,
) => {
  const { updateTag: updateTagDb } = await import("@/database/tag");

  await updateTagDb(id, updates);
  await loadTags();
};

// 删除标签
export const removeTag = async (id: string) => {
  const { deleteTag } = await import("@/database/tag");

  await deleteTag(id);
  await loadTags();
};
