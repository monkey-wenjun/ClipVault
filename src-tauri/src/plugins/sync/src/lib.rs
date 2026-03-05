use tauri::{
    generate_handler,
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

mod commands;

pub use commands::*;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("eco-sync")
        .setup(|app, _api| {
            app.manage(commands::SyncState::new());
            Ok(())
        })
        .invoke_handler(generate_handler![
            commands::set_sync_path,
            commands::get_sync_path,
            commands::enable_sync,
            commands::is_sync_enabled,
            commands::sync_now,
            commands::set_encryption_key,
            commands::is_encryption_enabled,
        ])
        .build()
}
