// 又拍云上传实现
// 参考文档: https://help.upyun.com/knowledge-base/rest_api/

use crate::commands::{ImageHostingConfig, UploadResult};

pub async fn upload(
    _image_data: Vec<u8>,
    _file_name: String,
    _config: ImageHostingConfig,
) -> Result<UploadResult, String> {
    Ok(UploadResult {
        success: false,
        error: Some("又拍云上传暂未实现".to_string()),
        url: None,
        markdown_url: None,
    })
}
