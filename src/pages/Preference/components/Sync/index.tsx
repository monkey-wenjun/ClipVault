import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import { open } from "@tauri-apps/plugin-dialog";
import { useBoolean, useMount } from "ahooks";
import { Alert, Button, Input, message, Switch, Tag } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { writeText } from "tauri-plugin-clipboard-x-api";
import ProList from "@/components/ProList";
import {
  enableSync,
  generateEncryptionKey,
  getSyncPath,
  getSyncStatus,
  isEncryptionEnabled,
  isSyncEnabled,
  restoreFromSync,
  setEncryptionKey,
  setSyncPath,
  syncNow,
} from "@/plugins/sync";

const Sync = () => {
  const { t } = useTranslation();
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncPath, setSyncPathState] = useState<string>("");
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [encryptionKey, setEncryptionKeyState] = useState<string>("");
  const [lastSync, setLastSync] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, { setTrue: startLoading, setFalse: stopLoading }] =
    useBoolean(false);
  const [
    restoreLoading,
    { setTrue: startRestoreLoading, setFalse: stopRestoreLoading },
  ] = useBoolean(false);

  useMount(async () => {
    try {
      const enabled = await isSyncEnabled();
      setSyncEnabled(enabled);

      const path = await getSyncPath();
      if (path) {
        setSyncPathState(path);
      }

      const encryptEnabled = await isEncryptionEnabled();
      setEncryptionEnabled(encryptEnabled);

      // 获取同步状态
      await refreshSyncStatus();
    } catch (error) {
      void error;
    }
  });

  const refreshSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setLastSync(status.last_sync || "");
      setIsSyncing(status.is_syncing);
    } catch (error) {
      void error;
    }
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: t("preference.sync.sync_settings.select_folder_title"),
      });

      if (selected && typeof selected === "string") {
        setSyncPathState(selected);
        await setSyncPath(selected);
        message.success(t("preference.sync.sync_settings.path_set_success"));
      }
    } catch (error) {
      void error;
      message.error(t("preference.sync.sync_settings.path_set_error"));
    }
  };

  const handleToggleSync = async (checked: boolean) => {
    try {
      await enableSync(checked);
      setSyncEnabled(checked);
      message.success(
        checked
          ? t("preference.sync.sync_settings.enabled_success")
          : t("preference.sync.sync_settings.disabled_success"),
      );
    } catch (error) {
      void error;
      message.error(t("preference.sync.sync_settings.toggle_error"));
    }
  };

  const handleGenerateKey = () => {
    const key = generateEncryptionKey();
    setEncryptionKeyState(key);
  };

  const handleCopyKey = async () => {
    try {
      await writeText(encryptionKey);
      message.success(t("preference.sync.encryption_settings.key_copied"));
    } catch (error) {
      void error;
      message.error(t("preference.sync.encryption_settings.key_copy_error"));
    }
  };

  const handleSaveKey = async () => {
    try {
      if (!encryptionKey || encryptionKey.length !== 64) {
        message.error(
          t("preference.sync.encryption_settings.invalid_key_length"),
        );
        return;
      }

      await setEncryptionKey(encryptionKey);
      setEncryptionEnabled(true);
      message.success(
        t("preference.sync.encryption_settings.key_saved_success"),
      );
    } catch (error) {
      void error;
      message.error(t("preference.sync.encryption_settings.key_save_error"));
    }
  };

  const handleDisableEncryption = async () => {
    try {
      await setEncryptionKey(null);
      setEncryptionEnabled(false);
      setEncryptionKeyState("");
      message.success(
        t("preference.sync.encryption_settings.encryption_disabled"),
      );
    } catch (error) {
      void error;
    }
  };

  const handleSyncNow = async () => {
    try {
      if (!syncPath) {
        message.warning(
          t("preference.sync.sync_settings.please_select_folder_first"),
        );
        return;
      }
      startLoading();
      setIsSyncing(true);
      await syncNow();
      await refreshSyncStatus();
      message.success(t("preference.sync.sync_settings.sync_success"));
    } catch (error) {
      void error;
      message.error(t("preference.sync.sync_settings.sync_error"));
    } finally {
      stopLoading();
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    try {
      if (!syncPath) {
        message.warning(
          t("preference.sync.sync_settings.please_select_folder_first"),
        );
        return;
      }
      startRestoreLoading();
      await restoreFromSync();
      message.success("数据恢复成功，请重启应用");
    } catch (error) {
      void error;
      message.error(`恢复失败：${String(error)}`);
    } finally {
      stopRestoreLoading();
    }
  };

  return (
    <>
      <ProList header={t("preference.sync.sync_settings.title")}>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">
              {t("preference.sync.sync_settings.label.enable_sync")}
            </div>
            <div className="text-color-3 text-xs">
              {t("preference.sync.sync_settings.hints.enable_sync")}
            </div>
          </div>
          <Switch checked={syncEnabled} onChange={handleToggleSync} />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex-1">
            <div className="font-medium">
              {t("preference.sync.sync_settings.label.sync_path")}
            </div>
            <div className="mt-1 text-color-3 text-xs">
              {syncPath || t("preference.sync.sync_settings.no_path_selected")}
            </div>
          </div>
          <Button onClick={handleSelectFolder} type="primary">
            {t("preference.sync.sync_settings.button.select_folder")}
          </Button>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">
              {t("preference.sync.sync_settings.label.manual_sync")}
            </div>
            <div className="text-color-3 text-xs">
              {t("preference.sync.sync_settings.hints.manual_sync")}
              {lastSync && (
                <span className="ml-2">
                  上次同步:
                  <Tag className="ml-1" color="blue">
                    {lastSync}
                  </Tag>
                </span>
              )}
            </div>
          </div>
          <Button
            disabled={!syncEnabled || isSyncing}
            loading={loading}
            onClick={handleSyncNow}
            type="primary"
          >
            {t("preference.sync.sync_settings.button.sync_now")}
          </Button>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">从备份恢复</div>
            <div className="text-color-3 text-xs">
              从同步目录恢复数据（会覆盖当前数据）
            </div>
          </div>
          <Button
            danger
            disabled={!syncEnabled}
            icon={<DownloadOutlined />}
            loading={restoreLoading}
            onClick={handleRestore}
          >
            恢复数据
          </Button>
        </div>
      </ProList>

      <ProList header={t("preference.sync.encryption_settings.title")}>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">
              {t("preference.sync.encryption_settings.label.status")}
            </div>
            <div className="text-color-3 text-xs">
              {encryptionEnabled
                ? t("preference.sync.encryption_settings.status_enabled")
                : t("preference.sync.encryption_settings.status_disabled")}
            </div>
          </div>
          {encryptionEnabled && (
            <Button danger onClick={handleDisableEncryption} size="small">
              {t("preference.sync.encryption_settings.button.disable")}
            </Button>
          )}
        </div>

        <div className="px-4 py-3">
          <div className="mb-2 font-medium">
            {t("preference.sync.encryption_settings.label.encryption_key")}
          </div>
          <div className="mb-3 text-color-3 text-xs">
            {t("preference.sync.encryption_settings.hints.encryption_key")}
          </div>

          {/* 安全提示 */}
          <Alert
            className="mb-3"
            description={t(
              "preference.sync.encryption_settings.security_warning_desc",
            )}
            message={t(
              "preference.sync.encryption_settings.security_warning_title",
            )}
            showIcon
            type="warning"
          />

          <div className="flex gap-2">
            <Input.Password
              className="flex-1"
              onChange={(e) => setEncryptionKeyState(e.target.value)}
              placeholder={t(
                "preference.sync.encryption_settings.placeholder.key",
              )}
              value={encryptionKey}
              visibilityToggle
            />
            <Button onClick={handleGenerateKey}>
              {t("preference.sync.encryption_settings.button.generate")}
            </Button>
            <Button
              disabled={!encryptionKey}
              icon={<CopyOutlined />}
              onClick={handleCopyKey}
            >
              {t("preference.sync.encryption_settings.button.copy")}
            </Button>
            <Button onClick={handleSaveKey} type="primary">
              {t("preference.sync.encryption_settings.button.save")}
            </Button>
          </div>
          {encryptionKey && (
            <div className="mt-2 text-color-3 text-xs">
              {t("preference.sync.encryption_settings.key_length", {
                length: encryptionKey.length,
              })}
            </div>
          )}
        </div>
      </ProList>

      {/* 同步说明 */}
      <Alert
        className="mx-4 mt-4"
        description={
          <div className="text-xs">
            <p>
              1. <b>自动同步</b>：剪贴板内容变化后 3 秒自动同步
            </p>
            <p>
              2. <b>定时同步</b>：每 5 分钟自动同步一次
            </p>
            <p>
              3. <b>手动同步</b>：点击"立即同步"按钮立即执行
            </p>
            <p>
              4. <b>同步文件</b>：未加密时生成 clipvault_sync.db，加密时生成
              clipvault_sync_encrypted.bin
            </p>
            <p>
              5. <b>多设备同步</b>
              ：将同步目录设置为云盘同步文件夹即可实现多设备同步
            </p>
          </div>
        }
        message="同步说明"
        showIcon
        type="info"
      />
    </>
  );
};

export default Sync;
