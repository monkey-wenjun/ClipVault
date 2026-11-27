import type { Locale as AntdLocale } from "antd/es/locale";
import antdEnUS from "antd/locale/en_US";
import antdJaJP from "antd/locale/ja_JP";
import antdZhCN from "antd/locale/zh_CN";
import antdZhTW from "antd/locale/zh_TW";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { LANGUAGE } from "@/constants";
import type { Language } from "@/types/store";
import enUS from "./en-US.json";
import jaJP from "./ja-JP.json";
import zhCN from "./zh-CN.json";
import zhTW from "./zh-TW.json";

/**
 * 从系统语言里检测应用支持的界面语言
 *
 * 规则：中文 -> 简体/繁体；日文 -> 日文；其它（含 "C"、未知 locale）一律回退英文，
 * 以保证非中文环境下默认展示英文界面。
 * @param locales 系统 locale 列表（如 ["zh-CN", "en"]），缺省时取浏览器/WebView 的系统语言
 */
export const detectLanguage = (
  ...locales: Array<string | null | undefined>
): Language => {
  const candidates = locales.length
    ? locales
    : [...(navigator.languages ?? []), navigator.language];

  for (const locale of candidates) {
    const lang = (locale ?? "").toLowerCase();

    if (lang.startsWith("zh")) {
      return ["tw", "hk", "hant"].some((region) => lang.includes(region))
        ? LANGUAGE.ZH_TW
        : LANGUAGE.ZH_CN;
    }

    if (lang.startsWith("ja")) {
      return LANGUAGE.JA_JP;
    }

    if (lang.startsWith("en")) {
      return LANGUAGE.EN_US;
    }
  }

  return LANGUAGE.EN_US;
};

i18n.use(initReactI18next).init({
  debug: false,
  fallbackLng: LANGUAGE.EN_US,
  interpolation: {
    escapeValue: false,
  },
  lng: detectLanguage(),
  resources: {
    [LANGUAGE.ZH_CN]: {
      translation: zhCN,
    },
    [LANGUAGE.ZH_TW]: {
      translation: zhTW,
    },
    [LANGUAGE.EN_US]: {
      translation: enUS,
    },
    [LANGUAGE.JA_JP]: {
      translation: jaJP,
    },
  },
});

export { i18n };

export const getAntdLocale = (language: Language = detectLanguage()) => {
  const antdLanguage: Record<Language, AntdLocale> = {
    [LANGUAGE.ZH_CN]: antdZhCN,
    [LANGUAGE.ZH_TW]: antdZhTW,
    [LANGUAGE.EN_US]: antdEnUS,
    [LANGUAGE.JA_JP]: antdJaJP,
  };

  return antdLanguage[language];
};
