import { emit } from "@tauri-apps/api/event";
import { proxy } from "valtio";
import { LISTEN_KEY } from "@/constants";
import type {
  DatabaseSchemaGroupId,
  DatabaseSchemaTag,
} from "@/types/database";

export interface TagStore {
  tags: DatabaseSchemaTag[];
  selectedTagId: string | null;
  group: DatabaseSchemaGroupId;
}

export const tagStore = proxy<TagStore>({
  group: "all",
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

  // 通知其他窗口标签已变化
  emit(LISTEN_KEY.TAGS_CHANGED);

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

  // 通知其他窗口标签已变化
  emit(LISTEN_KEY.TAGS_CHANGED);
};

// 删除标签
export const removeTag = async (id: string) => {
  const { deleteTag } = await import("@/database/tag");

  await deleteTag(id);
  await loadTags();

  // 通知其他窗口标签已变化
  emit(LISTEN_KEY.TAGS_CHANGED);
};

// 设置当前分组
export const setGroup = (group: DatabaseSchemaGroupId) => {
  tagStore.group = group;
};

// 设置选中的标签
export const setSelectedTagId = (id: string | null) => {
  tagStore.selectedTagId = id;
};
