mod core;
mod utils;

use core::{prevent_default, setup};
use tauri::{command, generate_context, Builder, Manager, WindowEvent, AppHandle, Runtime};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_eco_window::{show_main_window, MAIN_WINDOW_LABEL, PREFERENCE_WINDOW_LABEL};
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_notification::NotificationExt;

/// 发送系统通知
#[command]
async fn send_notification<R: Runtime>(
    app: AppHandle<R>,
    title: String,
    body: String,
) -> Result<(), String> {
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| format!("Failed to show notification: {}", e))?;
    Ok(())
}

/// 获取当前前台应用的名称（用于排除监听）
#[command]
async fn get_foreground_app_name() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        // macOS: 使用 AppleScript 获取前台应用
        match std::process::Command::new("osascript")
            .args(&["-e", "tell application \"System Events\" to get name of first application process whose frontmost is true"])
            .output()
        {
            Ok(output) if output.status.success() => {
                let name = String::from_utf8_lossy(&output.stdout).trim().to_string();
                Ok(name)
            }
            _ => Err("Failed to get foreground app name on macOS".to_string()),
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: 使用 PowerShell 获取前台窗口进程名
        match std::process::Command::new("powershell")
            .args(&["-Command", "Get-Process | Where-Object {$_.MainWindowHandle -ne 0} | Sort-Object {$_.StartTime} -Descending | Select-Object -First 1 | Select-Object -ExpandProperty ProcessName"])
            .output()
        {
            Ok(output) if output.status.success() => {
                let name = String::from_utf8_lossy(&output.stdout).trim().to_string();
                Ok(name)
            }
            _ => Err("Failed to get foreground app name on Windows".to_string()),
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Linux: 尝试使用 xdotool 或 wmctrl
        let commands = [
            ("xdotool", vec!["getactivewindow", "getwindowpid"]),
            ("wmctrl", vec!["-lp"]),
        ];

        for (cmd, args) in &commands {
            if let Ok(output) = std::process::Command::new(cmd).args(args).output() {
                if output.status.success() {
                    let output_str = String::from_utf8_lossy(&output.stdout);
                    // 简化处理：返回命令结果的前部分
                    return Ok(output_str.trim().split_whitespace().next().unwrap_or("unknown").to_string());
                }
            }
        }

        Err("Failed to get foreground app name on Linux".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            let main_window = app.get_webview_window(MAIN_WINDOW_LABEL).unwrap();

            let preference_window = app.get_webview_window(PREFERENCE_WINDOW_LABEL).unwrap();

            setup::default(&app_handle, main_window.clone(), preference_window.clone());

            Ok(())
        })
        // 确保在 windows 和 linux 上只有一个 app 实例在运行：https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/single-instance
        .plugin(tauri_plugin_single_instance::init(
            |app_handle, _argv, _cwd| {
                show_main_window(app_handle);
            },
        ))
        // app 自启动：https://github.com/tauri-apps/tauri-plugin-autostart/tree/v2
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--auto-launch"]),
        ))
        // 数据库：https://github.com/tauri-apps/tauri-plugin-sql/tree/v2
        .plugin(tauri_plugin_sql::Builder::default().build())
        // 日志插件：https://github.com/tauri-apps/tauri-plugin-log/tree/v2
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        // 快捷键插件: https://github.com/tauri-apps/tauri-plugin-global-shortcut
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // 操作系统相关信息插件：https://github.com/tauri-apps/tauri-plugin-os
        .plugin(tauri_plugin_os::init())
        // 系统级别对话框插件：https://github.com/tauri-apps/tauri-plugin-dialog
        .plugin(tauri_plugin_dialog::init())
        // 访问文件系统插件：https://github.com/tauri-apps/tauri-plugin-fs
        .plugin(tauri_plugin_fs::init())
        // 更新插件：https://github.com/tauri-apps/tauri-plugin-updater
        .plugin(tauri_plugin_updater::Builder::new().build())
        // 进程相关插件：https://github.com/tauri-apps/tauri-plugin-process
        .plugin(tauri_plugin_process::init())
        // 检查和请求 macos 系统权限：https://github.com/ayangweb/tauri-plugin-macos-permissions
        .plugin(tauri_plugin_macos_permissions::init())
        // 拓展了对文件和目录的操作：https://github.com/ayangweb/tauri-plugin-fs-pro
        .plugin(tauri_plugin_fs_pro::init())
        // 获取系统获取系统的区域设置：https://github.com/ayangweb/tauri-plugin-locale
        .plugin(tauri_plugin_locale::init())
        // 打开文件或者链接：https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/opener
        .plugin(tauri_plugin_opener::init())
        // 禁用 webview 的默认行为：https://github.com/ferreira-tb/tauri-plugin-prevent-default
        .plugin(prevent_default::init())
        // 剪贴板插件：https://github.com/ayangweb/tauri-plugin-clipboard-x
        .plugin(tauri_plugin_clipboard_x::init())
        // 通知插件：https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/notification
        .plugin(tauri_plugin_notification::init())
        // 自定义的窗口管理插件
        .plugin(tauri_plugin_eco_window::init())
        // 自定义粘贴的插件
        .plugin(tauri_plugin_eco_paste::init())
        // 自定义判断是否自动启动的插件
        .plugin(tauri_plugin_eco_autostart::init())
        // 自定义同步插件
        .plugin(tauri_plugin_eco_sync::init())
        // 自定义图床插件
        .plugin(tauri_plugin_eco_image_hosting::init())
        // 注册自定义命令
        .invoke_handler(tauri::generate_handler![get_foreground_app_name, send_notification])
        .on_window_event(|window, event| match event {
            // 让 app 保持在后台运行：https://tauri.app/v1/guides/features/system-tray/#preventing-the-app-from-closing
            WindowEvent::CloseRequested { api, .. } => {
                window.hide().unwrap();

                api.prevent_close();
            }
            _ => {}
        })
        .build(generate_context!())
        .expect("error while running tauri application");

    app.run(|app_handle, event| match event {
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen {
            has_visible_windows,
            ..
        } => {
            if has_visible_windows {
                return;
            }

            tauri_plugin_eco_window::show_preference_window(app_handle);
        }
        _ => {
            let _ = app_handle;
        }
    });
}
