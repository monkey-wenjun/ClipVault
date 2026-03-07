import type {
  ClipboardContentType,
  ReadClipboardItemUnion,
} from "tauri-plugin-clipboard-x-api";
import type { LiteralUnion } from "type-fest";

export type DatabaseSchemaHistorySubtype = "url" | "email" | "color" | "path";

export type DatabaseSchemaHistory<
  T extends ClipboardContentType = ClipboardContentType,
> = ReadClipboardItemUnion<T> & {
  id: string;
  group: DatabaseSchemaGroupId;
  search: string;
  favorite: boolean;
  createTime: string;
  note?: string;
  subtype?: DatabaseSchemaHistorySubtype;
  tags?: string; // JSON string of tag ids
  count?: number; // 内容长度/数量
};

export type DatabaseSchemaGroupId = LiteralUnion<
  "all" | "text" | "image" | "files" | "favorite" | "tag",
  string
>;

export interface DatabaseSchemaGroup {
  id: DatabaseSchemaGroupId;
  name: string;
  icon?: string;
  createTime?: string;
}

// 自定义标签
export interface DatabaseSchemaTag {
  id: string;
  name: string;
  color: string;
  createTime: string;
}

// 历史记录与标签关联
export interface DatabaseSchemaHistoryTag {
  historyId: string;
  tagId: string;
}

export interface DatabaseSchema {
  history: DatabaseSchemaHistory;
  group: DatabaseSchemaGroup;
  tag: DatabaseSchemaTag;
  historyTag: DatabaseSchemaHistoryTag;
}
