// AWS S3 上传实现
// 参考文档: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html

use crate::commands::{ImageHostingConfig, UploadResult};

pub async fn upload(
    _image_data: Vec<u8>,
    _file_name: String,
    _config: ImageHostingConfig,
) -> Result<UploadResult, String> {
    Ok(UploadResult {
        success: false,
        error: Some("AWS S3 上传暂未实现".to_string()),
        url: None,
        markdown_url: None,
    })
}
