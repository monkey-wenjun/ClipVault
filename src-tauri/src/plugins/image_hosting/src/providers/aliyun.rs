// 阿里云 OSS 上传实现
// 参考文档: https://help.aliyun.com/document_detail/31951.html

use crate::commands::{ImageHostingConfig, UploadResult};
use chrono::Utc;
use hmac::{Hmac, Mac};
use reqwest::Client;
use sha1::Sha1;

type HmacSha1 = Hmac<Sha1>;

/// 生成阿里云 OSS 签名
/// 签名格式: "OSS " + AccessKeyId + ":" + Signature
/// Signature = base64(hmac-sha1(AccessKeySecret, VERB + "\n" + Content-MD5 + "\n" + Content-Type + "\n" + Date + "\n" + CanonicalizedOSSHeaders + CanonicalizedResource))
fn generate_signature(
    access_key_id: &str,
    access_key_secret: &str,
    verb: &str,
    content_md5: &str,
    content_type: &str,
    date: &str,
    canonicalized_resource: &str,
) -> String {
    let string_to_sign = format!(
        "{}\n{}\n{}\n{}\n{}",
        verb, content_md5, content_type, date, canonicalized_resource
    );

    let mut mac = HmacSha1::new_from_slice(access_key_secret.as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(string_to_sign.as_bytes());
    let result = mac.finalize();
    let signature = base64_encode_data(&result.into_bytes());

    format!("OSS {}:{}", access_key_id, signature)
}

/// 获取 OSS Endpoint
fn get_endpoint(config: &ImageHostingConfig) -> String {
    if let Some(endpoint) = &config.endpoint {
        if !endpoint.is_empty() {
            return endpoint.clone();
        }
    }
    // 默认使用外网 Endpoint
    // Region 可能是 "oss-cn-shanghai" 或 "cn-shanghai"
    let region = if config.region.starts_with("oss-") {
        config.region.clone()
    } else {
        format!("oss-{}", config.region)
    };
    format!("{}.{}.aliyuncs.com", config.bucket, region)
}

pub async fn upload(
    image_data: Vec<u8>,
    file_name: String,
    config: ImageHostingConfig,
) -> Result<UploadResult, String> {
    let client = Client::new();
    
    // 构建存储路径
    let object_key = if let Some(prefix) = &config.path_prefix {
        if prefix.is_empty() {
            file_name
        } else {
            format!("{}/{}", prefix.trim_end_matches('/'), file_name)
        }
    } else {
        file_name
    };

    // 计算 Content-MD5
    let content_md5 = base64_encode_data(&compute_md5(&image_data));
    let content_type = "image/png"; // 根据实际情况调整
    let date = Utc::now().format("%a, %d %b %Y %H:%M:%S GMT").to_string();
    let endpoint = get_endpoint(&config);
    let canonicalized_resource = format!("/{}/{}", config.bucket, object_key);

    // 生成签名
    let authorization = generate_signature(
        &config.access_key,
        &config.secret_key,
        "PUT",
        &content_md5,
        content_type,
        &date,
        &canonicalized_resource,
    );

    // 构建请求 URL
    let url = format!("https://{}/{}", endpoint, object_key);

    // 发送 PUT 请求
    let response = client
        .put(&url)
        .header("Authorization", authorization)
        .header("Content-MD5", content_md5)
        .header("Content-Type", content_type)
        .header("Date", date)
        .body(image_data)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if response.status().is_success() {
        // 构建访问 URL
        let access_url = if let Some(custom_domain) = &config.custom_domain {
            if !custom_domain.is_empty() {
                format!("{}/{}", custom_domain.trim_end_matches('/'), object_key)
            } else {
                url.clone()
            }
        } else {
            url.clone()
        };

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

use crate::crypto::{base64_encode, base64_decode};

/// 计算 MD5
fn compute_md5(data: &[u8]) -> [u8; 16] {
    md5::compute(data).0
}

/// base64 编码封装
fn base64_encode_data(data: &[u8]) -> String {
    base64_encode(data)
}
