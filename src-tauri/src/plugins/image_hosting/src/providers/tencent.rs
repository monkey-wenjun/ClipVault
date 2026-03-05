// 腾讯云 COS 上传实现
// 参考文档: https://cloud.tencent.com/document/product/436/14114

use crate::commands::{ImageHostingConfig, UploadResult};

pub async fn upload(
    _image_data: Vec<u8>,
    _file_name: String,
    _config: ImageHostingConfig,
) -> Result<UploadResult, String> {
    Ok(UploadResult {
        success: false,
        error: Some("腾讯云 COS 上传暂未实现".to_string()),
        url: None,
        markdown_url: None,
    })
}
