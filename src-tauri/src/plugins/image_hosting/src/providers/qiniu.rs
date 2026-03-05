// 七牛云上传实现
// 参考文档: https://developer.qiniu.com/kodo/1206/put-policy

use crate::commands::{ImageHostingConfig, UploadResult};
use hmac::{Hmac, Mac};
use reqwest::Client;
use serde_json::json;
use sha1::Sha1;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha1 = Hmac<Sha1>;

/// 生成七牛云 Upload Token
/// 格式: <AccessKey>:<EncodedSign>:<EncodedPutPolicy>
fn generate_upload_token(access_key: &str, secret_key: &str, bucket: &str, key: &str) -> String {
    // 构建 PutPolicy
    let deadline = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        + 3600; // 1小时有效期

    let put_policy = json!({
        "scope": format!("{}:{}", bucket, key),
        "deadline": deadline,
        "returnBody": json!({
            "key": "$(key)",
            "hash": "$(etag)",
            "url": "$(url)"
        }).to_string()
    });

    let put_policy_str = put_policy.to_string();
    // URL Safe Base64 编码（不使用标准库的 URL_SAFE_NO_PAD）
    let encoded_put_policy = base64_encode_url_safe(&put_policy_str);

    // 计算签名
    let mut mac = HmacSha1::new_from_slice(secret_key.as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(encoded_put_policy.as_bytes());
    let result = mac.finalize();
    let encoded_sign = base64_encode_url_safe_bytes(&result.into_bytes());

    format!("{}:{}:{}", access_key, encoded_sign, encoded_put_policy)
}

/// 获取上传域名
fn get_upload_url(config: &ImageHostingConfig) -> String {
    if let Some(endpoint) = &config.endpoint {
        if !endpoint.is_empty() {
            return endpoint.clone();
        }
    }
    // 默认使用华东区域上传地址
    // 不同区域的上传地址不同
    match config.region.as_str() {
        "z0" | "cn-east-1" => "https://upload.qiniup.com".to_string(),
        "z1" | "cn-north-1" => "https://upload-z1.qiniup.com".to_string(),
        "z2" | "cn-south-1" => "https://upload-z2.qiniup.com".to_string(),
        "na0" | "us-north-1" => "https://upload-na0.qiniup.com".to_string(),
        "as0" | "ap-southeast-1" => "https://upload-as0.qiniup.com".to_string(),
        _ => "https://upload.qiniup.com".to_string(),
    }
}

/// 获取下载域名
fn get_download_url(config: &ImageHostingConfig, key: &str) -> String {
    if let Some(custom_domain) = &config.custom_domain {
        if !custom_domain.is_empty() {
            return format!("{}/{}", custom_domain.trim_end_matches('/'), key);
        }
    }
    // 使用默认的七牛云测试域名或自定义域名
    format!("https://{}/{}", config.bucket, key)
}

pub async fn upload(
    image_data: Vec<u8>,
    file_name: String,
    config: ImageHostingConfig,
) -> Result<UploadResult, String> {
    let client = Client::new();

    // 构建存储路径
    let key = if let Some(prefix) = &config.path_prefix {
        if prefix.is_empty() {
            file_name
        } else {
            format!("{}/{}", prefix.trim_end_matches('/'), file_name)
        }
    } else {
        file_name
    };

    // 生成 Upload Token
    let upload_token = generate_upload_token(
        &config.access_key,
        &config.secret_key,
        &config.bucket,
        &key,
    );

    let upload_url = get_upload_url(&config);

    // 构建 multipart/form-data 请求
    let form = reqwest::multipart::Form::new()
        .text("token", upload_token)
        .text("key", key.clone())
        .part(
            "file",
            reqwest::multipart::Part::bytes(image_data)
                .file_name(key.clone())
                .mime_str("image/png")
                .map_err(|e| format!("Invalid mime type: {}", e))?,
        );

    // 发送 POST 请求
    let response = client
        .post(&upload_url)
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if response.status().is_success() {
        // 解析返回结果
        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        // 构建访问 URL
        let access_url = get_download_url(&config, &key);

        let markdown_url = format!("![image]({})", access_url);

        Ok(UploadResult {
            success: true,
            url: Some(access_url),
            markdown_url: Some(markdown_url),
            error: None,
        })
    } else {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        Err(format!("Upload failed ({}): {}", status, error_text))
    }
}

/// URL Safe Base64 编码（将 + 替换为 -，/ 替换为 _，并去掉 = 填充）
fn base64_encode_url_safe(s: &str) -> String {
    let standard = base64::encode(s.as_bytes());
    standard
        .replace('+', "-")
        .replace('/', "_")
        .trim_end_matches('=')
        .to_string()
}

/// URL Safe Base64 编码字节数组
fn base64_encode_url_safe_bytes(data: &[u8]) -> String {
    let standard = base64::encode(data);
    standard
        .replace('+', "-")
        .replace('/', "_")
        .trim_end_matches('=')
        .to_string()
}

