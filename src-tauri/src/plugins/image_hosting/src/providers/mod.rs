// 图床提供商实现模块
// 每个提供商需要实现 upload 函数

pub mod aliyun;
pub mod aws;
pub mod github;
pub mod qiniu;
pub mod tencent;
pub mod upyun;

/// 生成唯一的文件名
pub fn generate_unique_filename(original_name: &str) -> String {
    let timestamp = chrono::Utc::now().timestamp_millis();
    let random = uuid::Uuid::new_v4().to_string()[..8].to_string();
    let ext = original_name
        .split('.')
        .last()
        .unwrap_or("png")
        .to_lowercase();
    format!("clip_{}_{}.{}", timestamp, random, ext)
}

/// 构建完整的 URL
pub fn build_url(base: &str, path: &str, custom_domain: Option<&str>) -> String {
    if let Some(domain) = custom_domain {
        format!("{}/{}", domain.trim_end_matches('/'), path)
    } else {
        format!("{}/{}", base.trim_end_matches('/'), path)
    }
}
