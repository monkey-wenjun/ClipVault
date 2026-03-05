import {
	DeleteOutlined,
	EditOutlined,
	ExportOutlined,
	ImportOutlined,
	PlusOutlined,
} from "@ant-design/icons";
import {
	Button,
	Form,
	Input,
	message,
	Modal,
	Radio,
	Space,
	Switch,
	Table,
	Tag,
} from "antd";
import { useBoolean, useMount } from "ahooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import { uploadImage } from "@/plugins/imageHosting";
import { imageHostingStore } from "@/stores/imageHosting";
import {
	exportAsEnv,
	exportImageHostingConfig,
	importImageHostingConfig,
} from "@/utils/imageHostingConfig";
import type {
	ImageHostingConfig,
	ImageHostingProvider,
} from "@/types/imageHosting";

const PROVIDER_OPTIONS: {
	value: ImageHostingProvider;
	label: string;
	icon: string;
}[] = [
	{ value: "aliyun", label: "阿里云 OSS", icon: "☁️" },
	{ value: "tencent", label: "腾讯云 COS", icon: "☁️" },
	{ value: "qiniu", label: "七牛云", icon: "☁️" },
	{ value: "upyun", label: "又拍云", icon: "☁️" },
	{ value: "aws", label: "AWS S3", icon: "☁️" },
	{ value: "github", label: "GitHub", icon: "🐙" },
];

const DEFAULT_CONFIG: Partial<ImageHostingConfig> = {
	provider: "aliyun",
	enabled: true,
	customDomain: "",
	region: "",
	bucket: "",
	endpoint: "",
	pathStyle: false,
};

const ImageHosting = () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { t } = useTranslation();
	const { enabled, configs, defaultId, autoUpload, generateMarkdown } =
		useSnapshot(imageHostingStore);
	const [isModalOpen, { setTrue: openModal, setFalse: closeModal }] =
		useBoolean(false);
	const [editingConfig, setEditingConfig] =
		useState<ImageHostingConfig | null>(null);
	const [form] = Form.useForm();
	const [testing, { setTrue: startTesting, setFalse: stopTesting }] =
		useBoolean(false);

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
			title: "确认删除",
			content: "删除后无法恢复，是否继续？",
			onOk: () => {
				const newConfigs = configs.filter((c) => c.id !== id);
				imageHostingStore.configs = newConfigs;
				if (defaultId === id) {
					imageHostingStore.defaultId = newConfigs[0]?.id || "";
				}
				message.success("删除成功");
			},
		});
	};

	const handleSave = async () => {
		try {
			const values = await form.validateFields();

			if (editingConfig) {
				// 编辑模式
				const index = configs.findIndex((c) => c.id === editingConfig.id);
				if (index !== -1) {
					const updated = { ...configs[index], ...values };
					if (!values.secretKey) {
						updated.secretKey = configs[index].secretKey; // 保留原密钥
					}
					imageHostingStore.configs[index] = updated;
				}
			} else {
				// 新增模式
				const newConfig: ImageHostingConfig = {
					...values,
					id: Date.now().toString(),
					createdAt: Date.now(),
				};
				imageHostingStore.configs.push(newConfig);
				if (!defaultId) {
					imageHostingStore.defaultId = newConfig.id;
				}
			}

			closeModal();
			message.success(editingConfig ? "修改成功" : "添加成功");
		} catch (error) {
			void error;
		}
	};

	const handleTest = async () => {
		try {
			const values = await form.validateFields();
			startTesting();

			// 构建测试配置
			const testConfig: ImageHostingConfig = {
				...DEFAULT_CONFIG,
				...values,
				id: "test",
				createdAt: Date.now(),
			} as ImageHostingConfig;

			// 测试上传一个 1x1 像素的透明 PNG
			const testImage = new Uint8Array([
				0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
				0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
				0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
				0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63,
				0xf8, 0x0f, 0x00, 0x00, 0x01, 0x01, 0x00, 0x05, 0x18, 0xd8, 0xae,
				0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
				0x82,
			]);

			const result = await uploadImage(testImage, "test.png", testConfig);

			if (result.success) {
				message.success(`测试成功！URL: ${result.url}`);
			} else {
				message.error(`测试失败: ${result.error}`);
			}
		} catch (error) {
			message.error(`测试失败: ${String(error)}`);
		} finally {
			stopTesting();
		}
	};

	const handleSetDefault = (id: string) => {
		imageHostingStore.defaultId = id;
		message.success("已设为默认");
	};

	const columns = [
		{
			title: "名称",
			dataIndex: "name",
			key: "name",
			render: (text: string, record: ImageHostingConfig) => (
				<Space>
					<span>
						{PROVIDER_OPTIONS.find((p) => p.value === record.provider)?.icon}
					</span>
					<span>{text}</span>
					{record.id === defaultId && <Tag color="blue">默认</Tag>}
				</Space>
			),
		},
		{
			title: "平台",
			dataIndex: "provider",
			key: "provider",
			render: (v: ImageHostingProvider) =>
				PROVIDER_OPTIONS.find((p) => p.value === v)?.label || v,
		},
		{
			title: "Bucket",
			dataIndex: "bucket",
			key: "bucket",
			ellipsis: true,
		},
		{
			title: "自定义域名",
			dataIndex: "customDomain",
			key: "customDomain",
			ellipsis: true,
			render: (v: string) => v || "-",
		},
		{
			title: "操作",
			key: "action",
			width: 200,
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
							设为默认
						</Button>
					)}
				</Space>
			),
		},
	];

	return (
		<>
			<ProList header="图床设置">
				<div className="flex items-center justify-between px-4 py-3">
					<div>
						<div className="font-medium">启用图床功能</div>
						<div className="text-color-3 text-xs">
							开启后复制图片将自动上传到云存储
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
						<div className="font-medium">自动上传图片</div>
						<div className="text-color-3 text-xs">
							复制图片时自动上传到配置的图床
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
						<div className="font-medium">生成 Markdown 链接</div>
						<div className="text-color-3 text-xs">
							上传成功后自动生成 Markdown 格式图片链接
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
						<span>图床配置</span>
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
								导入
							</Button>
							<Button
								icon={<ExportOutlined />}
								onClick={async () => {
									const success = await exportImageHostingConfig();
									if (success) {
										message.success("导出成功");
									} else {
										message.error("导出失败");
									}
								}}
								size="small"
							>
								导出
							</Button>
							<Button
								icon={<PlusOutlined />}
								onClick={handleAdd}
								size="small"
								type="primary"
							>
								添加图床
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
						size="small"
					/>
					{configs.length === 0 && (
						<div className="py-8 text-center text-gray-400">
							暂无图床配置，点击右上角添加
						</div>
					)}
				</div>
			</ProList>

			<Modal
				footer={[
					<Button key="test" loading={testing} onClick={handleTest}>
						测试连接
					</Button>,
					<Button key="cancel" onClick={closeModal}>
						取消
					</Button>,
					<Button key="save" onClick={handleSave} type="primary">
						保存
					</Button>,
				]}
				onCancel={closeModal}
				open={isModalOpen}
				title={editingConfig ? "编辑图床" : "添加图床"}
				width={560}
			>
				<Form form={form} layout="vertical" preserve={false}>
					<Form.Item
						label="图床名称"
						name="name"
						rules={[{ required: true, message: "请输入图床名称" }]}
					>
						<Input placeholder="例如：我的阿里云图床" />
					</Form.Item>

					<Form.Item
						label="云存储平台"
						name="provider"
						rules={[{ required: true }]}
					>
						<Radio.Group
							optionType="button"
							options={PROVIDER_OPTIONS.map((p) => ({
								value: p.value,
								label: p.label,
							}))}
						/>
					</Form.Item>

					<Form.Item
						label="Access Key (AK)"
						name="accessKey"
						rules={[{ required: true, message: "请输入 Access Key" }]}
					>
						<Input placeholder="" />
					</Form.Item>

					<Form.Item
						label="Secret Key (SK)"
						name="secretKey"
						rules={[
							{ required: !editingConfig, message: "请输入 Secret Key" },
						]}
					>
						<Input.Password
							placeholder={editingConfig ? "留空表示不修改" : ""}
						/>
					</Form.Item>

					<Form.Item
						label="Bucket 名称"
						name="bucket"
						rules={[{ required: true, message: "请输入 Bucket 名称" }]}
					>
						<Input placeholder="例如：my-bucket" />
					</Form.Item>

					<Form.Item
						label="存储区域 (Region)"
						name="region"
						rules={[{ required: true, message: "请输入存储区域" }]}
					>
						<Input placeholder="例如：oss-cn-hangzhou、ap-guangzhou" />
					</Form.Item>

					<Form.Item label="自定义域名 (可选)" name="customDomain">
						<Input placeholder="例如：https://img.example.com" />
					</Form.Item>

					<Form.Item label="存储路径前缀 (可选)" name="pathPrefix">
						<Input placeholder="例如：images/ 或 clips/" />
					</Form.Item>

					<Form.Item label="Endpoint (可选)" name="endpoint">
						<Input placeholder="自定义 API 端点地址" />
					</Form.Item>
				</Form>
			</Modal>
		</>
	);
};

export default ImageHosting;
