use tauri::{
    generate_handler,
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

mod commands;
mod providers;

pub use commands::*;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("eco-image-hosting")
        .setup(|_app, _api| {
            Ok(())
        })
        .invoke_handler(generate_handler![
            commands::upload_image,
            commands::upload_image_to_default,
        ])
        .build()
}
