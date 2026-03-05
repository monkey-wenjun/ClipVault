import {
  isRegistered,
  register,
  type ShortcutHandler,
  unregister,
} from "@tauri-apps/plugin-global-shortcut";
import { useUnmount } from "ahooks";
import { castArray } from "es-toolkit/compat";
import { useEffect, useRef } from "react";

export const useRegister = (
  handler: ShortcutHandler,
  deps: Array<string | string[] | undefined>,
) => {
  const registeredShortcutsRef = useRef<string[]>([]);

  useEffect(() => {
    const registerShortcuts = async () => {
      const [shortcuts] = deps;
      const newShortcuts = castArray(shortcuts).filter(Boolean) as string[];

      // 如果快捷键没有变化，跳过
      const currentRegistered = registeredShortcutsRef.current;
      const hasChanged =
        newShortcuts.length !== currentRegistered.length ||
        newShortcuts.some((s, i) => s !== currentRegistered[i]);

      if (!hasChanged) return;

      // 注销旧的快捷键
      for (const shortcut of currentRegistered) {
        try {
          const registered = await isRegistered(shortcut);
          if (registered) {
            await unregister(shortcut);
          }
        } catch (_e) {
          // 忽略注销错误
        }
      }
      registeredShortcutsRef.current = [];

      if (newShortcuts.length === 0) return;

      // 注册新的快捷键
      const successfullyRegistered: string[] = [];
      for (const shortcut of newShortcuts) {
        try {
          const registered = await isRegistered(shortcut);
          if (!registered) {
            await register(shortcut, (event) => {
              if (event.state === "Released") return;
              handler(event);
            });
            successfullyRegistered.push(shortcut);
          } else {
          }
        } catch (_e) {}
      }

      registeredShortcutsRef.current = successfullyRegistered;
    };

    registerShortcuts();
  }, deps);

  useUnmount(() => {
    const shortcuts = registeredShortcutsRef.current;
    for (const shortcut of shortcuts) {
      try {
        unregister(shortcut);
      } catch (_e) {
        // 忽略注销错误
      }
    }
    registeredShortcutsRef.current = [];
  });
};
