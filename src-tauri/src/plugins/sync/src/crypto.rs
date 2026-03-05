use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::RngCore as _;
use std::fmt;

pub const KEY_SIZE: usize = 32; // AES-256 key size
pub const NONCE_SIZE: usize = 12; // GCM nonce size

#[derive(Debug)]
pub enum CryptoError {
    EncryptionError(String),
    DecryptionError(String),
    InvalidKey,
    InvalidData,
}

impl fmt::Display for CryptoError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CryptoError::EncryptionError(e) => write!(f, "Encryption error: {}", e),
            CryptoError::DecryptionError(e) => write!(f, "Decryption error: {}", e),
            CryptoError::InvalidKey => write!(f, "Invalid encryption key"),
            CryptoError::InvalidData => write!(f, "Invalid data format"),
        }
    }
}

impl std::error::Error for CryptoError {}

/// 生成随机 AES-256 密钥
pub fn generate_key() -> [u8; KEY_SIZE] {
    let mut key = [0u8; KEY_SIZE];
    rand::thread_rng().fill_bytes(&mut key);
    key
}

/// 生成随机 nonce
fn generate_nonce() -> [u8; NONCE_SIZE] {
    let mut nonce = [0u8; NONCE_SIZE];
    rand::thread_rng().fill_bytes(&mut nonce);
    nonce
}

/// 使用 AES-256-GCM 加密数据
/// 返回格式: hex(nonce || ciphertext)
#[allow(deprecated)]
pub fn encrypt(plaintext: &[u8], key_hex: &str) -> Result<Vec<u8>, CryptoError> {
    let key = key_from_hex(key_hex)?;
    
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|_| CryptoError::InvalidKey)?;
    
    let nonce_bytes = generate_nonce();
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| CryptoError::EncryptionError(e.to_string()))?;
    
    // 拼接 nonce 和密文
    let mut result = Vec::with_capacity(NONCE_SIZE + ciphertext.len());
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);
    
    Ok(result)
}

/// 使用 AES-256-GCM 解密数据
/// 输入格式: hex(nonce || ciphertext)
#[allow(deprecated)]
pub fn decrypt(encrypted_data: &[u8], key_hex: &str) -> Result<Vec<u8>, CryptoError> {
    if encrypted_data.len() < NONCE_SIZE {
        return Err(CryptoError::InvalidData);
    }
    
    let key = key_from_hex(key_hex)?;
    
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|_| CryptoError::InvalidKey)?;
    
    let nonce = Nonce::from_slice(&encrypted_data[..NONCE_SIZE]);
    let ciphertext = &encrypted_data[NONCE_SIZE..];
    
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| CryptoError::DecryptionError(e.to_string()))?;
    
    Ok(plaintext)
}

/// 从 hex 字符串解析密钥
fn key_from_hex(hex_str: &str) -> Result<[u8; KEY_SIZE], CryptoError> {
    let bytes = hex::decode(hex_str)
        .map_err(|_| CryptoError::InvalidKey)?;
    
    if bytes.len() != KEY_SIZE {
        return Err(CryptoError::InvalidKey);
    }
    
    let mut key = [0u8; KEY_SIZE];
    key.copy_from_slice(&bytes);
    Ok(key)
}

/// 将密钥转换为 hex 字符串
pub fn key_to_hex(key: &[u8; KEY_SIZE]) -> String {
    hex::encode(key)
}

/// 生成随机密钥并返回 hex 格式
pub fn generate_key_hex() -> String {
    key_to_hex(&generate_key())
}
