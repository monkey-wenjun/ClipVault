import { getDatabase } from "./index";

/**
 * 获取最新的图片
 */
export const getImage = async () => {
  const db = await getDatabase();

  const result = await db
    .selectFrom("history")
    .where("type", "=", "image")
    .orderBy("createTime", "desc")
    .selectAll()
    .limit(1)
    .executeTakeFirst();

  return result;
};

/**
 * 获取最新的 N 张图片
 */
export const getImages = async (limit = 10) => {
  const db = await getDatabase();

  const result = await db
    .selectFrom("history")
    .where("type", "=", "image")
    .orderBy("createTime", "desc")
    .selectAll()
    .limit(limit)
    .execute();

  return result;
};
