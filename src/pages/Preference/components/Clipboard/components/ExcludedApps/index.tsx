import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, List, Select, Tag } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import { addExcludedApp, removeExcludedApp } from "@/plugins/exclusion";
import { clipboardStore } from "@/stores/clipboard";
import styles from "./index.module.scss";

// 预设的密码管理器应用
const PRESET_APPS = [
  { label: "1Password", value: "1Password" },
  { label: "KeePass", value: "KeePass" },
  { label: "KeePassXC", value: "KeePassXC" },
  { label: "LastPass", value: "LastPass" },
  { label: "Bitwarden", value: "Bitwarden" },
  { label: "Dashlane", value: "Dashlane" },
  { label: "NordPass", value: "NordPass" },
  { label: "RoboForm", value: "RoboForm" },
];

const ExcludedApps = () => {
  const { t } = useTranslation();
  const { exclusion } = useSnapshot(clipboardStore);
  const [inputValue, setInputValue] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>();

  const handleAdd = () => {
    const valueToAdd = inputValue.trim() || selectedPreset;
    if (valueToAdd) {
      addExcludedApp(valueToAdd);
      setInputValue("");
      setSelectedPreset(undefined);
    }
  };

  const handleRemove = (app: string) => {
    removeExcludedApp(app);
  };

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value) {
      setInputValue(value);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputSection}>
        <div className={styles.description}>
          {t("preference.clipboard.exclusion_settings.hints.excluded_apps")}
        </div>

        <div className={styles.inputRow}>
          <Select
            allowClear
            className={styles.presetSelect}
            onChange={handlePresetChange}
            options={PRESET_APPS}
            placeholder={t(
              "preference.clipboard.exclusion_settings.placeholder.select_preset",
            )}
            value={selectedPreset}
          />
          <span className={styles.orText}>
            {t("preference.clipboard.exclusion_settings.label.or")}
          </span>
          <Input
            className={styles.customInput}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleAdd}
            placeholder={t(
              "preference.clipboard.exclusion_settings.placeholder.custom_app",
            )}
            value={inputValue}
          />
          <Button
            disabled={!inputValue.trim() && !selectedPreset}
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
            type="primary"
          >
            {t("preference.clipboard.exclusion_settings.label.add")}
          </Button>
        </div>
      </div>

      {exclusion.apps.length > 0 ? (
        <ProList
          className={styles.appList}
          header={t(
            "preference.clipboard.exclusion_settings.label.excluded_apps_list",
          )}
        >
          <List
            dataSource={exclusion.apps}
            renderItem={(app) => (
              <List.Item
                actions={[
                  <Button
                    className={styles.deleteBtn}
                    danger
                    icon={<DeleteOutlined />}
                    key="delete"
                    onClick={() => handleRemove(app)}
                    size="large"
                    type="text"
                  />,
                ]}
                className={styles.appItem}
              >
                <div className={styles.appName}>
                  <Tag className={styles.appTag} color="blue">
                    {t(
                      "preference.clipboard.exclusion_settings.label.excluded",
                    )}
                  </Tag>
                  <span>{app}</span>
                </div>
              </List.Item>
            )}
            split={false}
          />
        </ProList>
      ) : (
        <div className={styles.emptyState}>
          {t("preference.clipboard.exclusion_settings.label.no_excluded_apps")}
        </div>
      )}
    </div>
  );
};

export default ExcludedApps;
