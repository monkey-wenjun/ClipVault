import { proxy } from "valtio";
import type { ImageHostingStore } from "@/types/imageHosting";

export const imageHostingStore = proxy<ImageHostingStore>({
	enabled: false,
	autoUpload: true,
	generateMarkdown: true,
	configs: [],
	defaultId: "",
});
