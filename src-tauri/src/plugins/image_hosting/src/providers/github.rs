// GitHub 上传实现
// 参考文档: https://docs.github.com/en/rest/repos/contents

use crate::commands::{ImageHostingConfig, UploadResult};

pub async fn upload(
    _image_data: Vec<u8>,
    file_name: String,
    config: ImageHostingConfig,
) -> Result<UploadResult, String> {
    // GitHub 使用 token 作为 access_key
    // repo 作为 bucket
    let url = format!(
        "https://raw.githubusercontent.com/{}/main/{}",
        config.bucket,
        file_name
    );
    
    Ok(UploadResult {
        success: false,
        error: Some("GitHub not implemented".to_string()),
        url: Some(url),
        markdown_url: None,
    })
}
