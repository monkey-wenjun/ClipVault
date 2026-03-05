import { proxy } from "valtio";
import type { ImageHostingStore } from "@/types/imageHosting";

export const imageHostingStore = proxy<ImageHostingStore>({
  autoUpload: true,
  configs: [],
  defaultId: "",
  enabled: false,
  generateMarkdown: true,
});
