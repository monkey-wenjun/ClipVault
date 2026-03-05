use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Manager, Runtime, State};
use std::path::{Path, PathBuf};
use std::fs;
use std::time::{Duration, Instant};
use std::sync::atomic::{AtomicBool, Ordering};
use crate::crypto;

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
pub struct SyncState {
    config: std::sync::Mutex<SyncConfig>,
    last_sync: std::sync::Mutex<Option<Instant>>,
    is_syncing: AtomicBool,
}

impl SyncState {
    pub fn new() -> Self {
        Self {
            config: std::sync::Mutex::new(SyncConfig::default()),
            last_sync: std::sync::Mutex::new(None),
            is_syncing: AtomicBool::new(false),
        }
    }

    pub fn can_sync(&self) -> bool {
        // 防止并发同步
        if self.is_syncing.load(Ordering::SeqCst) {
            return false;
        }

        // 检查同步间隔（至少间隔 5 秒）
        let last_sync = self.last_sync.lock().unwrap();
        if let Some(last) = *last_sync {
            if last.elapsed() < Duration::from_secs(5) {
                return false;
            }
        }
        true
    }

    pub fn mark_sync_start(&self) {
        self.is_syncing.store(true, Ordering::SeqCst);
    }

    pub fn mark_sync_end(&self) {
        let mut last_sync = self.last_sync.lock().unwrap();
        *last_sync = Some(Instant::now());
        self.is_syncing.store(false, Ordering::SeqCst);
    }
}

impl Default for SyncState {
    fn default() -> Self {
        Self::new()
    }
}

/// 获取应用数据目录下的数据库路径
fn get_database_path<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    // 数据库文件通常在 app_data_dir 下，名为 *.db
    // 尝试找到数据库文件
    let db_path = app_data_dir.join("clipboard.db");
    if db_path.exists() {
        return Ok(db_path);
    }
    
    // 如果找不到特定文件，返回目录，让调用者处理
    Ok(app_data_dir)
}

/// 获取同步文件路径
fn get_sync_file_path(sync_dir: &str, encrypted: bool) -> PathBuf {
    let filename = if encrypted {
        "clipvault_sync_encrypted.bin"
    } else {
        "clipvault_sync.db"
    };
    Path::new(sync_dir).join(filename)
}

/// 设置同步目录路径
#[command]
pub fn set_sync_path<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
    path: String,
) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.sync_path = Some(path);
    Ok(())
}

/// 获取同步目录路径
#[command]
pub fn get_sync_path<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
) -> Result<Option<String>, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.sync_path.clone())
}

/// 启用/禁用同步
#[command]
pub fn enable_sync<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
    enabled: bool,
) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.enabled = enabled;
    Ok(())
}

/// 检查同步是否启用
#[command]
pub fn is_sync_enabled<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
) -> Result<bool, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.enabled)
}

/// 立即执行同步
#[command]
pub async fn sync_now<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, SyncState>,
) -> Result<(), String> {
    // 检查是否可以同步
    if !state.can_sync() {
        return Err("Sync is already in progress or too frequent".to_string());
    }

    let config = state.config.lock().map_err(|e| e.to_string())?;
    
    if !config.enabled {
        return Err("Sync is not enabled".to_string());
    }
    
    let sync_path = config.sync_path.as_ref()
        .ok_or("Sync path not set")?;
    
    let encryption_enabled = config.encryption_enabled;
    let encryption_key = config.encryption_key.clone();
    
    // 标记同步开始
    state.mark_sync_start();
    
    // 获取数据库路径
    let db_path = get_database_path(&app)?;
    
    log::info!("Starting sync from {:?} to {}", db_path, sync_path);
    
    // 确保同步目录存在
    fs::create_dir_all(sync_path)
        .map_err(|e| format!("Failed to create sync directory: {}", e))?;
    
    let sync_file = get_sync_file_path(sync_path, encryption_enabled);
    
    if encryption_enabled {
        // 加密同步
        let key = encryption_key.ok_or("Encryption key not set")?;
        sync_with_encryption(&db_path, &sync_file, &key)?;
    } else {
        // 普通同步（直接复制）
        sync_plain(&db_path, &sync_file)?;
    }
    
    // 同时复制一个元数据文件，记录同步信息
    let meta_file = Path::new(sync_path).join("clipvault_sync_meta.json");
    let metadata = serde_json::json!({
        "version": "1.0.0",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "encrypted": encryption_enabled,
        "source_db": db_path.to_string_lossy().to_string(),
    });
    fs::write(&meta_file, serde_json::to_string_pretty(&metadata).unwrap())
        .map_err(|e| format!("Failed to write metadata: {}", e))?;
    
    log::info!("Sync completed successfully to {:?}", sync_file);
    
    // 标记同步结束
    state.mark_sync_end();
    
    Ok(())
}

/// 普通同步（直接复制文件）
fn sync_plain(source: &Path, dest: &Path) -> Result<(), String> {
    // 如果源是目录，找到数据库文件
    let source_file = if source.is_dir() {
        find_database_file(source)?
    } else {
        source.to_path_buf()
    };
    
    fs::copy(&source_file, dest)
        .map_err(|e| format!("Failed to copy database: {}", e))?;
    
    Ok(())
}

/// 加密同步
fn sync_with_encryption(source: &Path, dest: &Path, key_hex: &str) -> Result<(), String> {
    
    // 如果源是目录，找到数据库文件
    let source_file = if source.is_dir() {
        find_database_file(source)?
    } else {
        source.to_path_buf()
    };
    
    // 读取数据库文件
    let data = fs::read(&source_file)
        .map_err(|e| format!("Failed to read database: {}", e))?;
    
    // 加密数据
    let encrypted = crypto::encrypt(&data, key_hex)
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    // 写入加密文件
    fs::write(dest, encrypted)
        .map_err(|e| format!("Failed to write encrypted file: {}", e))?;
    
    Ok(())
}

/// 从同步目录恢复数据
#[command]
pub async fn restore_from_sync<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, SyncState>,
) -> Result<(), String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    
    if !config.enabled {
        return Err("Sync is not enabled".to_string());
    }
    
    let sync_path = config.sync_path.as_ref()
        .ok_or("Sync path not set")?;
    
    let encryption_enabled = config.encryption_enabled;
    let encryption_key = config.encryption_key.clone();
    
    let sync_file = get_sync_file_path(sync_path, encryption_enabled);
    
    if !sync_file.exists() {
        return Err("No sync file found".to_string());
    }
    
    // 获取本地数据库路径
    let db_path = get_database_path(&app)?;
    let db_file = if db_path.is_dir() {
        find_database_file(&db_path)?
    } else {
        db_path
    };
    
    // 备份当前数据库
    let backup_path = db_file.with_extension("db.backup");
    if db_file.exists() {
        fs::copy(&db_file, &backup_path)
            .map_err(|e| format!("Failed to create backup: {}", e))?;
    }
    
    if encryption_enabled {
        // 解密恢复
        let key = encryption_key.ok_or("Encryption key not set")?;
        restore_with_decryption(&sync_file, &db_file, &key)?;
    } else {
        // 直接复制
        fs::copy(&sync_file, &db_file)
            .map_err(|e| format!("Failed to restore database: {}", e))?;
    }
    
    log::info!("Restore completed successfully from {:?}", sync_file);
    
    Ok(())
}

/// 解密恢复
fn restore_with_decryption(source: &Path, dest: &Path, key_hex: &str) -> Result<(), String> {
    
    // 读取加密文件
    let encrypted = fs::read(source)
        .map_err(|e| format!("Failed to read encrypted file: {}", e))?;
    
    // 解密数据
    let decrypted = crypto::decrypt(&encrypted, key_hex)
        .map_err(|e| format!("Decryption failed: {}", e))?;
    
    // 写入数据库文件
    fs::write(dest, decrypted)
        .map_err(|e| format!("Failed to write database: {}", e))?;
    
    Ok(())
}

/// 在目录中查找数据库文件
fn find_database_file(dir: &Path) -> Result<PathBuf, String> {
    // 首先尝试常见的数据库文件名
    let possible_names = ["clipboard.db", "data.db", "app.db", "database.db"];
    
    for name in &possible_names {
        let path = dir.join(name);
        if path.exists() {
            return Ok(path);
        }
    }
    
    // 查找任何 .db 文件
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map_or(false, |ext| ext == "db") {
                return Ok(path);
            }
        }
    }
    
    Err("No database file found".to_string())
}

/// 设置加密密钥
#[command]
pub fn set_encryption_key<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
    key: Option<String>,
) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    
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
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.encryption_enabled)
}

/// 检查同步状态（是否正在同步，上次同步时间等）
#[command]
pub fn get_sync_status<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, SyncState>,
) -> Result<serde_json::Value, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    let last_sync = state.last_sync.lock().map_err(|e| e.to_string())?;
    let is_syncing = state.is_syncing.load(Ordering::SeqCst);
    
    let last_sync_time = last_sync.map(|t| {
        let elapsed = t.elapsed().as_secs();
        if elapsed < 60 {
            format!("{} 秒前", elapsed)
        } else if elapsed < 3600 {
            format!("{} 分钟前", elapsed / 60)
        } else {
            format!("{} 小时前", elapsed / 3600)
        }
    });
    
    Ok(serde_json::json!({
        "enabled": config.enabled,
        "sync_path": config.sync_path,
        "encryption_enabled": config.encryption_enabled,
        "is_syncing": is_syncing,
        "last_sync": last_sync_time,
    }))
}
