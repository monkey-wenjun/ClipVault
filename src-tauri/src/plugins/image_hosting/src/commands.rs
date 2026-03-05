use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Runtime};

pub mod providers;
mod crypto;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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

/// 加密配置中的敏感信息
fn encrypt_config(config: &mut ImageHostingConfig) -> Result<(), String> {
    // 加密 access_key
    if !crypto::is_encrypted(&config.access_key) {
        config.access_key = crypto::encrypt(&config.access_key)?;
    }
    // 加密 secret_key
    if !crypto::is_encrypted(&config.secret_key) {
        config.secret_key = crypto::encrypt(&config.secret_key)?;
    }
    Ok(())
}

/// 解密配置中的敏感信息
fn decrypt_config(config: &mut ImageHostingConfig) -> Result<(), String> {
    // 解密 access_key
    if crypto::is_encrypted(&config.access_key) {
        config.access_key = crypto::decrypt(&config.access_key)?;
    }
    // 解密 secret_key
    if crypto::is_encrypted(&config.secret_key) {
        config.secret_key = crypto::decrypt(&config.secret_key)?;
    }
    Ok(())
}

/// 解密配置用于上传
fn decrypt_config_for_use(config: &ImageHostingConfig) -> Result<ImageHostingConfig, String> {
    let mut decrypted = config.clone();
    decrypt_config(&mut decrypted)?;
    Ok(decrypted)
}

/// 上传图片到指定图床
#[command]
pub async fn upload_image<R: Runtime>(
    _app: AppHandle<R>,
    image_data: Vec<u8>,
    file_name: String,
    mut config: ImageHostingConfig,
) -> Result<UploadResult, String> {
    // 解密配置
    decrypt_config(&mut config)?;
    
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

/// 加密图床配置（用于前端存储）
#[command]
pub fn encrypt_image_hosting_config(
    mut config: ImageHostingConfig,
) -> Result<ImageHostingConfig, String> {
    encrypt_config(&mut config)?;
    Ok(config)
}

/// 解密图床配置（用于前端显示）
#[command]
pub fn decrypt_image_hosting_config(
    mut config: ImageHostingConfig,
) -> Result<ImageHostingConfig, String> {
    decrypt_config(&mut config)?;
    Ok(config)
}

/// 上传到默认图床（从全局状态读取默认配置）
#[command]
pub async fn upload_image_to_default<R: Runtime>(
    _app: AppHandle<R>,
    _image_data: Vec<u8>,
    _file_name: String,
) -> Result<UploadResult, String> {
    Ok(UploadResult {
        success: false,
        error: Some("Please use upload_image with config instead".to_string()),
        url: None,
        markdown_url: None,
    })
}
