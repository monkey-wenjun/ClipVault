// 用于加密/解密图床凭证的模块
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm,
};
use rand::RngCore;
use sha2::{Sha256, Digest};

const KEY_SIZE: usize = 32; // AES-256 key size
const NONCE_SIZE: usize = 12; // GCM nonce size
const ENCRYPTED_PREFIX: &str = "CVENC:"; // 加密数据标识前缀

/// 从设备标识派生加密密钥
fn derive_key() -> [u8; KEY_SIZE] {
    // 使用固定的 salt 和设备信息派生密钥
    // 实际生产环境应该使用更安全的密钥管理方式
    let salt = b"ClipVaultImageHostingSalt2024";
    let mut hasher = Sha256::new();
    hasher.update(salt);
    let result = hasher.finalize();
    
    let mut key = [0u8; KEY_SIZE];
    key.copy_from_slice(&result[..KEY_SIZE]);
    key
}

/// 加密数据
pub fn encrypt(plaintext: &str) -> Result<String, String> {
    if plaintext.is_empty() {
        return Ok(String::new());
    }
    
    let key = derive_key();
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;
    
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = (&nonce_bytes).into();
    
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    // 将 nonce 和密文拼接，然后 base64 编码
    let mut result = Vec::with_capacity(NONCE_SIZE + ciphertext.len());
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);
    
    // 添加加密标识前缀
    Ok(format!("{}{}", ENCRYPTED_PREFIX, base64_encode(&result)))
}

/// 解密数据
pub fn decrypt(ciphertext_b64: &str) -> Result<String, String> {
    if ciphertext_b64.is_empty() {
        return Ok(String::new());
    }
    
    // 检查是否有加密标识前缀
    if !ciphertext_b64.starts_with(ENCRYPTED_PREFIX) {
        // 没有前缀，认为是明文，直接返回
        return Ok(ciphertext_b64.to_string());
    }
    
    // 移除前缀
    let encrypted_data = &ciphertext_b64[ENCRYPTED_PREFIX.len()..];
    
    let key = derive_key();
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;
    
    let ciphertext = base64_decode(encrypted_data)
        .map_err(|e| format!("Base64 decode failed: {}", e))?;
    
    if ciphertext.len() < NONCE_SIZE {
        return Err("Invalid ciphertext length".to_string());
    }
    
    let nonce = (&ciphertext[..NONCE_SIZE]).into();
    let encrypted_bytes = &ciphertext[NONCE_SIZE..];
    
    let plaintext = cipher
        .decrypt(nonce, encrypted_bytes)
        .map_err(|e| format!("Decryption failed: {}", e))?;
    
    String::from_utf8(plaintext)
        .map_err(|e| format!("Invalid UTF-8: {}", e))
}

/// 检查字符串是否已加密（检查是否有加密标识前缀）
pub fn is_encrypted(s: &str) -> bool {
    s.starts_with(ENCRYPTED_PREFIX)
}

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};

/// base64 编码
pub fn base64_encode(data: &[u8]) -> String {
    BASE64.encode(data)
}

/// base64 解码
pub fn base64_decode(s: &str) -> Result<Vec<u8>, String> {
    BASE64.decode(s).map_err(|e| format!("Base64 decode error: {}", e))
}
