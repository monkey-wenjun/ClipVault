use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Runtime, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    pub enabled: bool,
    pub sync_path: Option<String>,
    pub encryption_enabled: bool,
    pub encryption_key: Option<String>, // hex encoded key
}

impl Default for SyncConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            sync_path: None,
            encryption_enabled: false,
            encryption_key: None,
        }
    }
}

// 存储同步配置
pub struct SyncState(std::sync::Mutex<SyncConfig>);

impl SyncState {
    pub fn new() -> Self {
        Self(std::sync::Mutex::new(SyncConfig::default()))
    }
}

impl Default for SyncState {
    fn default() -> Self {
        Self::new()
    }
}

/// 设置同步目录路径
#[command]
pub fn set_sync_path<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
    path: String,
) -> Result<(), String> {
    let mut config = state.0.lock().map_err(|e| e.to_string())?;
    config.sync_path = Some(path);
    Ok(())
}

/// 获取同步目录路径
#[command]
pub fn get_sync_path<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
) -> Result<Option<String>, String> {
    let config = state.0.lock().map_err(|e| e.to_string())?;
    Ok(config.sync_path.clone())
}

/// 启用/禁用同步
#[command]
pub fn enable_sync<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
    enabled: bool,
) -> Result<(), String> {
    let mut config = state.0.lock().map_err(|e| e.to_string())?;
    config.enabled = enabled;
    Ok(())
}

/// 检查同步是否启用
#[command]
pub fn is_sync_enabled<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
) -> Result<bool, String> {
    let config = state.0.lock().map_err(|e| e.to_string())?;
    Ok(config.enabled)
}

/// 立即执行同步
#[command]
pub async fn sync_now<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
) -> Result<(), String> {
    let config = state.0.lock().map_err(|e| e.to_string())?;
    
    if !config.enabled {
        return Err("Sync is not enabled".to_string());
    }
    
    let sync_path = config.sync_path.as_ref()
        .ok_or("Sync path not set")?;
    
    // TODO: 实现实际的同步逻辑
    // 1. 获取数据库路径
    // 2. 读取数据库内容
    // 3. 加密（如果启用）
    // 4. 写入同步目录
    
    println!("Syncing to: {}", sync_path);
    
    Ok(())
}

/// 设置加密密钥
#[command]
pub fn set_encryption_key<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
    key: Option<String>,
) -> Result<(), String> {
    let mut config = state.0.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref k) = key {
        if k.len() != 64 {
            return Err("Invalid key length. Expected 64 hex characters (32 bytes)".to_string());
        }
        config.encryption_enabled = true;
        config.encryption_key = key;
    } else {
        config.encryption_enabled = false;
        config.encryption_key = None;
    }
    
    Ok(())
}

/// 检查加密是否启用
#[command]
pub fn is_encryption_enabled<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
) -> Result<bool, String> {
    let config = state.0.lock().map_err(|e| e.to_string())?;
    Ok(config.encryption_enabled)
}
