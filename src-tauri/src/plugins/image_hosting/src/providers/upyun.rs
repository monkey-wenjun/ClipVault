// 又拍云上传实现
// 参考文档: https://help.upyun.com/knowledge-base/rest_api/

use crate::commands::{ImageHostingConfig, UploadResult};

pub async fn upload(
    _image_data: Vec<u8>,
    file_name: String,
    config: ImageHostingConfig,
) -> Result<UploadResult, String> {
    let url = format!(
        "https://{}/{}",
        config.bucket,
        file_name
    );
    
    Ok(UploadResult {
        success: false,
        error: Some("Upyun not implemented".to_string()),
        url: Some(url),
        markdown_url: None,
    })
}
