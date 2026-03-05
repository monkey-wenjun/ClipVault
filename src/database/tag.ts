import type {
  DatabaseSchemaHistoryTag,
  DatabaseSchemaTag,
} from "@/types/database";
import { getDatabase } from ".";

// 标签操作
export const selectTags = async () => {
  const db = await getDatabase();

  return db.selectFrom("tag").selectAll().execute() as Promise<
    DatabaseSchemaTag[]
  >;
};

export const insertTag = async (data: DatabaseSchemaTag) => {
  const db = await getDatabase();

  return db.insertInto("tag").values(data).execute();
};

export const updateTag = async (
  id: string,
  nextData: Partial<DatabaseSchemaTag>,
) => {
  const db = await getDatabase();

  return db.updateTable("tag").set(nextData).where("id", "=", id).execute();
};

export const deleteTag = async (id: string) => {
  const db = await getDatabase();

  // 先删除关联
  await db.deleteFrom("historyTag").where("tagId", "=", id).execute();

  // 再删除标签
  return db.deleteFrom("tag").where("id", "=", id).execute();
};

// 历史记录标签关联操作
export const selectHistoryTags = async (historyId: string) => {
  const db = await getDatabase();

  return db
    .selectFrom("historyTag")
    .selectAll()
    .where("historyId", "=", historyId)
    .execute() as Promise<DatabaseSchemaHistoryTag[]>;
};

export const selectHistoryTagIds = async (historyId: string) => {
  const db = await getDatabase();

  const result = await db
    .selectFrom("historyTag")
    .select("tagId")
    .where("historyId", "=", historyId)
    .execute();

  return result.map((item) => item.tagId);
};

export const addTagToHistory = async (historyId: string, tagId: string) => {
  const db = await getDatabase();

  // 检查是否已存在
  const existing = await db
    .selectFrom("historyTag")
    .selectAll()
    .where("historyId", "=", historyId)
    .where("tagId", "=", tagId)
    .executeTakeFirst();

  if (existing) return;

  return db.insertInto("historyTag").values({ historyId, tagId }).execute();
};

export const removeTagFromHistory = async (
  historyId: string,
  tagId: string,
) => {
  const db = await getDatabase();

  return db
    .deleteFrom("historyTag")
    .where("historyId", "=", historyId)
    .where("tagId", "=", tagId)
    .execute();
};

export const getTagById = async (id: string) => {
  const db = await getDatabase();

  return db
    .selectFrom("tag")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst() as Promise<DatabaseSchemaTag | undefined>;
};

// 获取历史记录的所有标签
export const getHistoryTags = async (historyId: string) => {
  const db = await getDatabase();

  const tagIds = await selectHistoryTagIds(historyId);

  if (tagIds.length === 0) return [];

  return db
    .selectFrom("tag")
    .selectAll()
    .where("id", "in", tagIds)
    .execute() as Promise<DatabaseSchemaTag[]>;
};

// 根据标签ID获取历史记录
export const selectHistoryByTagId = async (tagId: string) => {
  const db = await getDatabase();

  return db
    .selectFrom("historyTag")
    .select("historyId")
    .where("tagId", "=", tagId)
    .execute();
};
