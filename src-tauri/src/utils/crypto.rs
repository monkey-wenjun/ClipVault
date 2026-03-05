#![allow(dead_code)]
#![allow(deprecated)]

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::RngExt;
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
    rand::rng().fill(&mut key);
    key
}

/// 生成随机 nonce
fn generate_nonce() -> [u8; NONCE_SIZE] {
    let mut nonce = [0u8; NONCE_SIZE];
    rand::rng().fill(&mut nonce);
    nonce
}

/// 使用 AES-256-GCM 加密数据
/// 返回格式: [nonce (12 bytes) || ciphertext]
pub fn encrypt(plaintext: &[u8], key: &[u8; KEY_SIZE]) -> Result<Vec<u8>, CryptoError> {
    let cipher = Aes256Gcm::new_from_slice(key)
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
/// 输入格式: [nonce (12 bytes) || ciphertext]
pub fn decrypt(encrypted_data: &[u8], key: &[u8; KEY_SIZE]) -> Result<Vec<u8>, CryptoError> {
    if encrypted_data.len() < NONCE_SIZE {
        return Err(CryptoError::InvalidData);
    }
    
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|_| CryptoError::InvalidKey)?;
    
    let nonce = Nonce::from_slice(&encrypted_data[..NONCE_SIZE]);
    let ciphertext = &encrypted_data[NONCE_SIZE..];
    
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| CryptoError::DecryptionError(e.to_string()))?;
    
    Ok(plaintext)
}

/// 从密码派生密钥（使用简单的哈希，生产环境建议使用 PBKDF2 或 Argon2）
pub fn derive_key_from_password(password: &str) -> [u8; KEY_SIZE] {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut key = [0u8; KEY_SIZE];
    let password_bytes = password.as_bytes();
    
    // 简单的密钥派生，实际使用建议使用 pbkdf2
    for (i, byte) in key.iter_mut().enumerate() {
        let mut hasher = DefaultHasher::new();
        password_bytes.hash(&mut hasher);
        i.hash(&mut hasher);
        *byte = (hasher.finish() & 0xFF) as u8;
    }
    
    key
}

/// 将密钥转换为 hex 字符串
pub fn key_to_hex(key: &[u8; KEY_SIZE]) -> String {
    hex::encode(key)
}

/// 从 hex 字符串解析密钥
pub fn key_from_hex(hex_str: &str) -> Result<[u8; KEY_SIZE], CryptoError> {
    let bytes = hex::decode(hex_str)
        .map_err(|_| CryptoError::InvalidKey)?;
    
    if bytes.len() != KEY_SIZE {
        return Err(CryptoError::InvalidKey);
    }
    
    let mut key = [0u8; KEY_SIZE];
    key.copy_from_slice(&bytes);
    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let key = generate_key();
        let plaintext = b"Hello, World! This is a test message.";
        
        let encrypted = encrypt(plaintext, &key).unwrap();
        let decrypted = decrypt(&encrypted, &key).unwrap();
        
        assert_eq!(plaintext.to_vec(), decrypted);
    }

    #[test]
    fn test_key_hex_conversion() {
        let key = generate_key();
        let hex = key_to_hex(&key);
        let parsed_key = key_from_hex(&hex).unwrap();
        
        assert_eq!(key, parsed_key);
    }
}
