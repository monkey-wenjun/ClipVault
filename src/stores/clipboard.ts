import { proxy } from "valtio";
import type { ClipboardStore } from "@/types/store";

export const clipboardStore = proxy<ClipboardStore>({
  audio: {
    copy: false,
  },

  content: {
    autoFavorite: false,
    autoPaste: "single",
    autoSort: false,
    copyPlain: false,
    deleteConfirm: true,
    operationButtons: ["copy", "star", "delete"],
    pastePlain: true,
    showOriginalContent: false,
  },

  exclusion: {
    apps: [],
  },

  history: {
    duration: 0,
    maxCount: 0,
    unit: 1,
  },

  search: {
    autoClear: false,
    defaultFocus: false,
    position: "top",
  },
  window: {
    backTop: false,
    position: "remember",
    showAll: false,
    style: "standard",
  },
});
