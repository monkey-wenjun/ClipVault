const COMMANDS: &[&str] = &[
    "set_sync_path",
    "get_sync_path",
    "enable_sync",
    "is_sync_enabled",
    "sync_now",
    "set_encryption_key",
    "is_encryption_enabled",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
