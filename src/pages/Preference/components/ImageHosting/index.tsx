import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useBoolean } from "ahooks";
import {
  Button,
  Form,
  Input,
  Modal,
  message,
  Radio,
  Space,
  Switch,
  Table,
  Tag,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import { encryptConfig, uploadImage } from "@/plugins/imageHosting";
import { imageHostingStore } from "@/stores/imageHosting";
import type {
  ImageHostingConfig,
  ImageHostingProvider,
} from "@/types/imageHosting";
import {
  exportImageHostingConfig,
  importImageHostingConfig,
} from "@/utils/imageHostingConfig";

const ImageHosting = () => {
  const { t } = useTranslation();
  const { enabled, configs, defaultId, autoUpload, generateMarkdown } =
    useSnapshot(imageHostingStore);
  const [isModalOpen, { setTrue: openModal, setFalse: closeModal }] =
    useBoolean(false);
  const [editingConfig, setEditingConfig] = useState<ImageHostingConfig | null>(
    null,
  );
  const [form] = Form.useForm();
  const [testing, { setTrue: startTesting, setFalse: stopTesting }] =
    useBoolean(false);

  const PROVIDER_OPTIONS: {
    value: ImageHostingProvider;
    label: string;
    icon: string;
  }[] = [
    {
      icon: "☁️",
      label: t("preference.imageHosting.providers.aliyun"),
      value: "aliyun",
    },
    {
      icon: "☁️",
      label: t("preference.imageHosting.providers.tencent"),
      value: "tencent",
    },
    {
      icon: "☁️",
      label: t("preference.imageHosting.providers.qiniu"),
      value: "qiniu",
    },
    {
      icon: "☁️",
      label: t("preference.imageHosting.providers.upyun"),
      value: "upyun",
    },
    {
      icon: "☁️",
      label: t("preference.imageHosting.providers.aws"),
      value: "aws",
    },
    {
      icon: "🐙",
      label: t("preference.imageHosting.providers.github"),
      value: "github",
    },
  ];

  const DEFAULT_CONFIG: Partial<ImageHostingConfig> = {
    bucket: "",
    customDomain: "",
    enabled: true,
    endpoint: "",
    pathStyle: false,
    provider: "aliyun",
    region: "",
  };

  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    form.setFieldsValue(DEFAULT_CONFIG);
    openModal();
  };

  const handleEdit = (config: ImageHostingConfig) => {
    setEditingConfig(config);
    form.setFieldsValue({
      ...config,
      secretKey: "", // 不回显密钥
    });
    openModal();
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      content: t("preference.imageHosting.confirm.delete_content"),
      onOk: () => {
        const newConfigs = configs.filter((c) => c.id !== id);
        imageHostingStore.configs = newConfigs;
        if (defaultId === id) {
          imageHostingStore.defaultId = newConfigs[0]?.id || "";
        }
        message.success(t("preference.imageHosting.message.delete_success"));
      },
      title: t("preference.imageHosting.confirm.delete_title"),
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      let configToSave: ImageHostingConfig;

      if (editingConfig) {
        // 编辑模式
        configToSave = { ...editingConfig, ...values };
        if (!values.secretKey) {
          configToSave.secretKey = editingConfig.secretKey; // 保留原密钥
        }
        // 加密配置
        configToSave = await encryptConfig(configToSave);

        const index = configs.findIndex((c) => c.id === editingConfig.id);
        if (index !== -1) {
          imageHostingStore.configs[index] = configToSave;
        }
      } else {
        // 新增模式
        configToSave = {
          ...values,
          createdAt: Date.now(),
          id: Date.now().toString(),
        } as ImageHostingConfig;
        // 加密配置
        configToSave = await encryptConfig(configToSave);

        imageHostingStore.configs.push(configToSave);
        if (!defaultId) {
          imageHostingStore.defaultId = configToSave.id;
        }
      }

      closeModal();
      message.success(
        editingConfig
          ? t("preference.imageHosting.message.update_success")
          : t("preference.imageHosting.message.add_success"),
      );
    } catch (error) {
      void error;
    }
  };

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      startTesting();

      // 构建测试配置
      let testConfig: ImageHostingConfig = {
        ...DEFAULT_CONFIG,
        ...values,
        createdAt: Date.now(),
        id: "test",
      } as ImageHostingConfig;

      // 处理 SK：如果表单中为空，使用编辑配置的加密 SK；否则加密新的 SK
      if (!values.secretKey && editingConfig) {
        // 使用已保存的加密 SK
        testConfig.secretKey = editingConfig.secretKey;
      } else if (values.secretKey) {
        // 加密新的 SK
        testConfig = await encryptConfig(testConfig);
      }

      // 测试上传一个 1x1 像素的透明 PNG
      const testImage = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0x0f, 0x00, 0x00,
        0x01, 0x01, 0x00, 0x05, 0x18, 0xd8, 0xae, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const result = await uploadImage(testImage, "test.png", testConfig);

      if (result.success) {
        message.success(
          t("preference.imageHosting.message.test_success", {
            url: result.url,
          }),
        );
      } else {
        message.error(
          `${t("preference.imageHosting.message.test_error")}: ${result.error}`,
        );
      }
    } catch (error) {
      message.error(
        `${t("preference.imageHosting.message.test_error")}: ${String(error)}`,
      );
    } finally {
      stopTesting();
    }
  };

  const handleSetDefault = (id: string) => {
    imageHostingStore.defaultId = id;
    message.success(t("preference.imageHosting.message.set_default_success"));
  };

  const columns = [
    {
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ImageHostingConfig) => (
        <Space>
          <span>
            {PROVIDER_OPTIONS.find((p) => p.value === record.provider)?.icon}
          </span>
          <span>{text}</span>
          {record.id === defaultId && (
            <Tag color="blue">{t("preference.imageHosting.default_tag")}</Tag>
          )}
        </Space>
      ),
      title: t("preference.imageHosting.columns.name"),
      width: 180,
    },
    {
      dataIndex: "provider",
      key: "provider",
      render: (v: ImageHostingProvider) =>
        PROVIDER_OPTIONS.find((p) => p.value === v)?.label || v,
      title: t("preference.imageHosting.columns.provider"),
      width: 100,
    },
    {
      dataIndex: "bucket",
      ellipsis: true,
      key: "bucket",
      title: t("preference.imageHosting.columns.bucket"),
      width: 120,
    },
    {
      dataIndex: "customDomain",
      ellipsis: true,
      key: "customDomain",
      render: (v: string) => v || "-",
      title: t("preference.imageHosting.columns.customDomain"),
      width: 160,
    },
    {
      key: "action",
      render: (_: unknown, record: ImageHostingConfig) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            type="text"
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
            type="text"
          />
          {record.id !== defaultId && (
            <Button
              onClick={() => handleSetDefault(record.id)}
              size="small"
              type="link"
            >
              {t("preference.imageHosting.button.set_default")}
            </Button>
          )}
        </Space>
      ),
      title: t("preference.imageHosting.columns.action"),
      width: 160,
    },
  ];

  return (
    <>
      <ProList header={t("preference.imageHosting.title")}>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">
              {t("preference.imageHosting.label.enable")}
            </div>
            <div className="text-color-3 text-xs">
              {t("preference.imageHosting.hints.enable")}
            </div>
          </div>
          <Switch
            checked={enabled}
            onChange={(v) => {
              imageHostingStore.enabled = v;
            }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">
              {t("preference.imageHosting.label.auto_upload")}
            </div>
            <div className="text-color-3 text-xs">
              {t("preference.imageHosting.hints.auto_upload")}
            </div>
          </div>
          <Switch
            checked={autoUpload}
            onChange={(v) => {
              imageHostingStore.autoUpload = v;
            }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium">
              {t("preference.imageHosting.label.generate_markdown")}
            </div>
            <div className="text-color-3 text-xs">
              {t("preference.imageHosting.hints.generate_markdown")}
            </div>
          </div>
          <Switch
            checked={generateMarkdown}
            onChange={(v) => {
              imageHostingStore.generateMarkdown = v;
            }}
          />
        </div>
      </ProList>

      <ProList
        header={
          <div className="flex items-center justify-between">
            <span>{t("preference.imageHosting.title")}</span>
            <div className="flex gap-2">
              <Button
                icon={<ImportOutlined />}
                onClick={async () => {
                  const result = await importImageHostingConfig();
                  if (result.success) {
                    message.success(result.message);
                  } else {
                    message.error(result.message);
                  }
                }}
                size="small"
              >
                {t("preference.imageHosting.button.import")}
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={async () => {
                  const success = await exportImageHostingConfig();
                  if (success) {
                    message.success(
                      t("preference.imageHosting.message.export_success"),
                    );
                  } else {
                    message.error(
                      t("preference.imageHosting.message.export_error"),
                    );
                  }
                }}
                size="small"
              >
                {t("preference.imageHosting.button.export")}
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={handleAdd}
                size="small"
                type="primary"
              >
                {t("preference.imageHosting.button.add")}
              </Button>
            </div>
          </div>
        }
      >
        <div className="px-4 py-2">
          <Table
            columns={columns}
            dataSource={configs}
            pagination={false}
            rowKey="id"
            scroll={{ x: 720 }}
            size="small"
          />
          {configs.length === 0 && (
            <div className="py-8 text-center text-gray-400">
              {t("preference.imageHosting.no_config")}
            </div>
          )}
        </div>
      </ProList>

      <Modal
        footer={[
          <Button key="test" loading={testing} onClick={handleTest}>
            {t("preference.imageHosting.button.test")}
          </Button>,
          <Button key="cancel" onClick={closeModal}>
            {t("preference.imageHosting.button.cancel")}
          </Button>,
          <Button key="save" onClick={handleSave} type="primary">
            {t("preference.imageHosting.button.save")}
          </Button>,
        ]}
        onCancel={closeModal}
        open={isModalOpen}
        title={
          editingConfig
            ? t("preference.imageHosting.modal.edit_title")
            : t("preference.imageHosting.modal.add_title")
        }
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label={t("preference.imageHosting.label.name")}
            name="name"
            rules={[
              {
                message: t("preference.imageHosting.label.name"),
                required: true,
              },
            ]}
          >
            <Input
              placeholder={t("preference.imageHosting.placeholder.name")}
            />
          </Form.Item>

          <Form.Item
            label={t("preference.imageHosting.label.provider")}
            name="provider"
            rules={[{ required: true }]}
          >
            <Radio.Group
              options={PROVIDER_OPTIONS.map((p) => ({
                label: p.label,
                value: p.value,
              }))}
              optionType="button"
            />
          </Form.Item>

          <Form.Item
            label={t("preference.imageHosting.label.accessKey")}
            name="accessKey"
            rules={[
              {
                message: t("preference.imageHosting.label.accessKey"),
                required: true,
              },
            ]}
          >
            <Input placeholder="" />
          </Form.Item>

          <Form.Item
            label={t("preference.imageHosting.label.secretKey")}
            name="secretKey"
            rules={[
              {
                message: t("preference.imageHosting.label.secretKey"),
                required: !editingConfig,
              },
            ]}
          >
            <Input.Password
              placeholder={
                editingConfig
                  ? t("preference.imageHosting.secretKey_placeholder")
                  : ""
              }
            />
          </Form.Item>

          <Form.Item
            label={t("preference.imageHosting.label.bucket")}
            name="bucket"
            rules={[
              {
                message: t("preference.imageHosting.label.bucket"),
                required: true,
              },
            ]}
          >
            <Input placeholder="" />
          </Form.Item>

          <Form.Item
            help={t("preference.imageHosting.placeholder.region")}
            label={t("preference.imageHosting.label.region")}
            name="region"
            rules={[
              {
                message: t("preference.imageHosting.label.region"),
                required: true,
              },
            ]}
          >
            <Input
              placeholder={t("preference.imageHosting.placeholder.region")}
            />
          </Form.Item>

          <Form.Item
            label={t("preference.imageHosting.label.customDomain")}
            name="customDomain"
          >
            <Input
              placeholder={t(
                "preference.imageHosting.placeholder.customDomain",
              )}
            />
          </Form.Item>

          <Form.Item
            label={t("preference.imageHosting.label.pathPrefix")}
            name="pathPrefix"
          >
            <Input
              placeholder={t("preference.imageHosting.placeholder.pathPrefix")}
            />
          </Form.Item>

          <Form.Item
            label={t("preference.imageHosting.label.endpoint")}
            name="endpoint"
          >
            <Input
              placeholder={t("preference.imageHosting.placeholder.endpoint")}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ImageHosting;
