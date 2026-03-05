import { useBoolean, useKeyPress } from "ahooks";
import {
  type FC,
  type HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import UnoIcon from "@/components/UnoIcon";
import { PRESET_SHORTCUT } from "@/constants";
import { useTauriFocus } from "@/hooks/useTauriFocus";
import { clipboardStore } from "@/stores/clipboard";
import { MainContext } from "../..";
import styles from "./index.module.scss";

const SearchInput: FC<HTMLAttributes<HTMLDivElement>> = (props) => {
  const { rootState } = useContext(MainContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<string>();
  const [isComposition, { setTrue, setFalse }] = useBoolean();
  const { t } = useTranslation();

  useEffect(() => {
    if (isComposition) return;
    rootState.search = value;
  }, [value, isComposition]);

  useTauriFocus({
    onBlur() {
      const { search } = clipboardStore;
      if (search.autoClear) {
        setValue(void 0);
      }
    },
    onFocus() {
      const { search } = clipboardStore;
      if (search.defaultFocus) {
        inputRef.current?.focus();
      } else {
        inputRef.current?.blur();
      }
    },
  });

  useKeyPress(PRESET_SHORTCUT.SEARCH, () => {
    inputRef.current?.focus();
  });

  return (
    <div className={styles.container} {...props}>
      <UnoIcon className={styles.icon} name="i-lucide:search" />
      <input
        autoComplete="off"
        autoCorrect="off"
        className={styles.input}
        onChange={(e) => setValue(e.target.value)}
        onCompositionEnd={setFalse}
        onCompositionStart={setTrue}
        placeholder={t("clipboard.hints.search_placeholder")}
        ref={inputRef as any}
        type="text"
        value={value || ""}
      />
      {value && (
        <button
          className={styles.clear}
          onClick={() => setValue("")}
          type="button"
        >
          <UnoIcon name="i-lucide:x" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
