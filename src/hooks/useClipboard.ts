import { useMount } from "ahooks";
import { cloneDeep } from "es-toolkit";
import { isEmpty, remove } from "es-toolkit/compat";
import { nanoid } from "nanoid";
import {
	type ClipboardChangeOptions,
	onClipboardChange,
	startListening,
} from "tauri-plugin-clipboard-x-api";
import { fullName } from "tauri-plugin-fs-pro-api";
import {
	insertHistory,
	selectHistory,
	updateHistory,
} from "@/database/history";
import type { State } from "@/pages/Main";
import { getClipboardTextSubtype } from "@/plugins/clipboard";
import {
	generateFileName,
	generateMarkdownImage,
	uploadImageToDefault,
} from "@/plugins/imageHosting";
import { triggerAutoSync } from "@/plugins/sync";
import { clipboardStore } from "@/stores/clipboard";
import { imageHostingStore } from "@/stores/imageHosting";
import type { DatabaseSchemaHistory } from "@/types/database";
import { formatDate } from "@/utils/dayjs";
import { writeText } from "tauri-plugin-clipboard-x-api";

export const useClipboard = (
	state: State,
	options?: ClipboardChangeOptions,
) => {
	useMount(async () => {
		await startListening();

		onClipboardChange(async (result) => {
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
				let imageUrl = localPath;
				let search = localPath;

				// 检查是否启用图床自动上传
				if (
					imageHostingStore.enabled &&
					imageHostingStore.autoUpload &&
					imageHostingStore.configs.length > 0
				) {
					try {
						// 读取图片文件
						const response = await fetch(localPath);
						const blob = await response.blob();
						const arrayBuffer = await blob.arrayBuffer();
						const imageData = new Uint8Array(arrayBuffer);

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
					} catch (error) {
						console.error("Image upload failed:", error);
						// 上传失败仍使用本地路径
					}
				}

				Object.assign(data, image, {
					group: "image",
					value: imageUrl,
					search: search,
				});
			}

			const sqlData = cloneDeep(data);

			const { type, value, group, createTime } = data;

			if (type === "image") {
				sqlData.value = await fullName(value);
			}

			if (type === "files") {
				sqlData.value = JSON.stringify(value);
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
		}, options);
	});
};
