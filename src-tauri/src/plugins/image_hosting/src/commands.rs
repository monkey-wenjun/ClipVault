use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Runtime};

pub mod providers;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageHostingConfig {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub access_key: String,
    pub secret_key: String,
    pub bucket: String,
    pub region: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_domain: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path_prefix: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub endpoint: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub markdown_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// 上传图片到指定图床
#[command]
pub async fn upload_image<R: Runtime>(
    _app: AppHandle<R>,
    image_data: Vec<u8>,
    file_name: String,
    config: ImageHostingConfig,
) -> Result<UploadResult, String> {
    match config.provider.as_str() {
        "aliyun" => providers::aliyun::upload(image_data, file_name, config).await,
        "qiniu" => providers::qiniu::upload(image_data, file_name, config).await,
        "tencent" => providers::tencent::upload(image_data, file_name, config).await,
        "upyun" => providers::upyun::upload(image_data, file_name, config).await,
        "aws" => providers::aws::upload(image_data, file_name, config).await,
        "github" => providers::github::upload(image_data, file_name, config).await,
        _ => Err(format!("Unsupported provider: {}", config.provider)),
    }
}

/// 上传到默认图床（从全局状态读取默认配置）
#[command]
pub async fn upload_image_to_default<R: Runtime>(
    app: AppHandle<R>,
    image_data: Vec<u8>,
    file_name: String,
) -> Result<UploadResult, String> {
    // 尝试从状态中获取默认图床配置
    // 注意：这里需要从前端传递配置或使用持久化存储
    // 简化实现：返回错误提示
    Ok(UploadResult {
        success: false,
        error: Some("Please use upload_image with config instead".to_string()),
        url: None,
        markdown_url: None,
    })
}

pub mod providers {
    pub mod aliyun;
    pub mod aws;
    pub mod github;
    pub mod qiniu;
    pub mod tencent;
    pub mod upyun;
}
