import {
  ExportOutlined,
  ImportOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { Button, message } from "antd";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import ProListItem from "@/components/ProListItem";
import ProSwitch from "@/components/ProSwitch";
import { useImmediateKey } from "@/hooks/useImmediateKey";
import { globalStore } from "@/stores/global";
import {
  exportAllConfig,
  importAllConfig,
  resetAllConfig,
} from "@/utils/configExport";
import { isMac } from "@/utils/is";
import Language from "./components/Language";
import MacosPermissions from "./components/MacosPermissions";
import ThemeMode from "./components/ThemeMode";

const General = () => {
  const { app, update } = useSnapshot(globalStore);
  const { t } = useTranslation();

  // 监听自动启动变更
  useImmediateKey(globalStore.app, "autoStart", async (value) => {
    const enabled = await isEnabled();

    if (value && !enabled) {
      return enable();
    }

    if (!value && enabled) {
      disable();
    }
  });

  return (
    <>
      {isMac && <MacosPermissions />}

      <ProList header={t("preference.settings.app_settings.title")}>
        <ProSwitch
          onChange={(value) => {
            globalStore.app.autoStart = value;
          }}
          title={t("preference.settings.app_settings.label.auto_start")}
          value={app.autoStart}
        />

        <ProSwitch
          description={t("preference.settings.app_settings.hints.silent_start")}
          onChange={(value) => {
            globalStore.app.silentStart = value;
          }}
          title={t("preference.settings.app_settings.label.silent_start")}
          value={app.silentStart}
        />

        <ProSwitch
          onChange={(value) => {
            globalStore.app.showMenubarIcon = value;
          }}
          title={t("preference.settings.app_settings.label.show_menubar_icon")}
          value={app.showMenubarIcon}
        />

        <ProSwitch
          onChange={(value) => {
            globalStore.app.showTaskbarIcon = value;
          }}
          title={t("preference.settings.app_settings.label.show_taskbar_icon")}
          value={app.showTaskbarIcon}
        />
      </ProList>

      <ProList header={t("preference.settings.appearance_settings.title")}>
        <Language />

        <ThemeMode />
      </ProList>

      <ProList header={t("preference.settings.update_settings.title")}>
        <ProSwitch
          onChange={(value) => {
            globalStore.update.auto = value;
          }}
          title={t("preference.settings.update_settings.label.auto_update")}
          value={update.auto}
        />

        <ProSwitch
          description={t(
            "preference.settings.update_settings.hints.update_beta",
          )}
          onChange={(value) => {
            globalStore.update.beta = value;
          }}
          title={t("preference.settings.update_settings.label.update_beta")}
          value={update.beta}
        />
      </ProList>

      <ProList header={t("preference.settings.config_management.title")}>
        <ProListItem
          description={t(
            "preference.settings.config_management.export_description",
          )}
          title={t("preference.settings.config_management.export_title")}
        >
          <Button
            icon={<ExportOutlined />}
            onClick={async () => {
              const success = await exportAllConfig();
              if (success) {
                message.success(
                  t("preference.settings.config_management.export_success"),
                );
              }
            }}
          >
            {t("preference.settings.config_management.export_button")}
          </Button>
        </ProListItem>

        <ProListItem
          description={t(
            "preference.settings.config_management.import_description",
          )}
          title={t("preference.settings.config_management.import_title")}
        >
          <Button
            icon={<ImportOutlined />}
            onClick={async () => {
              const result = await importAllConfig();
              if (result.success) {
                message.success(result.message);
              } else {
                message.error(result.message);
              }
            }}
          >
            {t("preference.settings.config_management.import_button")}
          </Button>
        </ProListItem>

        <ProListItem
          description={t(
            "preference.settings.config_management.reset_description",
          )}
          title={t("preference.settings.config_management.reset_title")}
        >
          <Button
            danger
            icon={<ReloadOutlined />}
            onClick={async () => {
              const success = await resetAllConfig();
              if (success) {
                message.success(
                  t("preference.settings.config_management.reset_success"),
                );
              }
            }}
          >
            {t("preference.settings.config_management.reset_button")}
          </Button>
        </ProListItem>
      </ProList>
    </>
  );
};

export default General;
