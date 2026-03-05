import { readFile } from "@tauri-apps/plugin-fs";
import { useMount } from "ahooks";
import { cloneDeep } from "es-toolkit";
import { isEmpty, remove } from "es-toolkit/compat";
import { nanoid } from "nanoid";
import { useRef } from "react";
import {
  type ClipboardChangeOptions,
  onClipboardChange,
  startListening,
  writeText,
} from "tauri-plugin-clipboard-x-api";

import {
  insertHistory,
  selectHistory,
  updateHistory,
} from "@/database/history";
import type { State } from "@/pages/Main";
import { getClipboardTextSubtype } from "@/plugins/clipboard";
import { isAppExcluded } from "@/plugins/exclusion";
import { generateFileName, uploadImageToDefault } from "@/plugins/imageHosting";
import { triggerAutoSync } from "@/plugins/sync";
import { clipboardStore } from "@/stores/clipboard";
import { imageHostingStore } from "@/stores/imageHosting";
import type { DatabaseSchemaHistory } from "@/types/database";
import { formatDate } from "@/utils/dayjs";

export const useClipboard = (
  state: State,
  options?: ClipboardChangeOptions,
) => {
  // 使用 ref 防止热重载导致的重复处理
  const processingRef = useRef<Set<string>>(new Set());
  const unlistenRef = useRef<(() => void) | null>(null);

  useMount(async () => {
    await startListening();

    // 如果已经有监听器，先清理（防止热重载导致的重复监听）
    if (unlistenRef.current) {
      unlistenRef.current();
    }

    const unlisten = await onClipboardChange(async (result) => {
      // 检查当前应用是否在排除列表中
      if (await isAppExcluded()) {
        return;
      }

      const { files, image, html, rtf, text } = result;

      if (isEmpty(result) || Object.values(result).every(isEmpty)) return;

      const { copyPlain } = clipboardStore.content;

      const data = {
        createTime: formatDate(),
        favorite: false,
        group: "text",
        id: nanoid(),
        search: text?.value,
      } as DatabaseSchemaHistory;

      if (files) {
        Object.assign(data, files, {
          group: "files",
          search: files.value.join(" "),
        });
      } else if (html && !copyPlain) {
        Object.assign(data, html);
      } else if (rtf && !copyPlain) {
        Object.assign(data, rtf);
      } else if (text) {
        const subtype = await getClipboardTextSubtype(text.value);

        Object.assign(data, text, {
          subtype,
        });
      } else if (image) {
        // 处理图片上传
        const localPath = image.value;

        // 使用 ref 检查是否正在处理此图片（防止热重载导致的重复）
        if (processingRef.current.has(localPath)) {
          return;
        }
        processingRef.current.add(localPath);

        // 检查内存列表中是否已存在相同路径的图片
        const existingItem = state.list.find(
          (item) => item.type === "image" && item.value === localPath,
        );
        if (existingItem) {
          processingRef.current.delete(localPath);
          return;
        }

        // 检查文件是否存在
        let fileExists = false;
        try {
          await readFile(localPath);
          fileExists = true;
        } catch (_e) {}

        if (!fileExists) {
          // 文件不存在，跳过
          return;
        }

        let imageUrl = localPath;
        let search = localPath;

        // 检查是否启用图床自动上传
        if (
          imageHostingStore.enabled &&
          imageHostingStore.autoUpload &&
          imageHostingStore.configs.length > 0
        ) {
          try {
            // 读取图片文件（使用 Tauri 的 fs API）
            const imageData = await readFile(localPath);

            // 生成文件名
            const fileName = generateFileName(localPath);

            // 上传到图床
            const uploadResult = await uploadImageToDefault(
              imageData,
              fileName,
            );

            if (uploadResult.success && uploadResult.url) {
              imageUrl = uploadResult.url;
              search = uploadResult.url;

              // 如果需要生成 Markdown 链接，写入剪贴板
              if (
                imageHostingStore.generateMarkdown &&
                uploadResult.markdownUrl
              ) {
                await writeText(uploadResult.markdownUrl);
              }
            }
          } catch {
            // 上传失败仍使用本地路径
          }
        }

        Object.assign(data, image, {
          group: "image",
          search: search,
          value: imageUrl,
        });
      }

      const sqlData = cloneDeep(data);

      const { type, value, group, createTime } = data;

      if (type === "image") {
        // 截图插件返回的路径已经是完整路径，直接使用
        // 不需要调用 fullName 转换
        sqlData.value = value;
      }

      if (type === "files") {
        sqlData.value = JSON.stringify(value);
      }

      // 先检查内存列表中是否已存在相同的图片（避免短时间内重复添加）
      const existingInList = state.list.find(
        (item) => item.type === sqlData.type && item.value === sqlData.value,
      );
      if (existingInList) {
        // 清理处理标记
        if (type === "image") {
          processingRef.current.delete(value as string);
        }
        return;
      }

      const [matched] = await selectHistory((qb) => {
        const { type, value } = sqlData;

        return qb.where("type", "=", type).where("value", "=", value);
      });

      const visible = state.group === "all" || state.group === group;
      if (matched) {
        if (!clipboardStore.content.autoSort) return;

        const { id } = matched;

        if (visible) {
          remove(state.list, { id });

          state.list.unshift({ ...data, id });
        }

        return updateHistory(id, { createTime });
      }

      if (visible) {
        state.list.unshift(data);
      }

      await insertHistory(sqlData);

      // 触发自动同步
      triggerAutoSync();

      // 处理完成，清理标记
      if (type === "image") {
        processingRef.current.delete(value as string);
      }
    }, options);

    unlistenRef.current = unlisten;

    return () => {
      unlistenRef.current?.();
      unlistenRef.current = null;
    };
  });
};
