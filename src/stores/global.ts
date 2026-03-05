import { proxy } from "valtio";
import type { GlobalStore } from "@/types/store";

export const globalStore = proxy<GlobalStore>({
  app: {
    autoStart: true,
    showMenubarIcon: true,
    showTaskbarIcon: false,
    silentStart: true,
  },

  appearance: {
    isDark: false,
    theme: "auto",
  },

  env: {},

  shortcut: {
    clipboard: "CommandOrControl+Shift+V",
    pastePlain: "",
    preference: "Alt+X",
    quickPaste: {
      enable: false,
      value: "Command+Shift",
    },
    imageHosting: "CommandOrControl+Shift+P",
  },

  update: {
    auto: false,
    beta: false,
  },
});
