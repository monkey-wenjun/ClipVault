const COMMANDS: &[&str] = &["upload_image", "upload_image_to_default"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
