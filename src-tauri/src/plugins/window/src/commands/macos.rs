use super::{is_main_window, shared_hide_window, shared_show_window};
use crate::MAIN_WINDOW_LABEL;
use tauri::{command, AppHandle, Runtime, WebviewWindow};
use tauri_nspanel::{CollectionBehavior, ManagerExt};

const WINDOW_HEIGHT: f64 = 720.0;
const WINDOW_WIDTH_RATIO: f64 = 0.88; // 窗口宽度占屏幕宽度的比例

pub enum MacOSPanelStatus {
    Show,
    Hide,
    Resign,
}

// 显示窗口
#[command]
pub async fn show_window<R: Runtime>(app_handle: AppHandle<R>, window: WebviewWindow<R>) {
    if is_main_window(&window) {
        // 设置窗口大小（工作区域宽度的 85%，两侧保留空隙）
        if let Some(monitor) = window.current_monitor().ok().flatten() {
            let work_area = monitor.work_area();
            let work_size = work_area.size;
            let work_position = work_area.position;
            
            let window_width = (work_size.width as f64 * WINDOW_WIDTH_RATIO) as u32;
            let window_x = work_position.x + ((work_size.width - window_width) as i32 / 2);
            let window_y = work_position.y + (work_size.height as i32) - (WINDOW_HEIGHT as i32);
            
            let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: window_width.max(1000), // 最小宽度 1000
                height: WINDOW_HEIGHT as u32,
            }));
            
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                x: window_x,
                y: window_y.max(work_position.y + 20), // 确保不会贴顶
            }));
        }
        
        set_macos_panel(&app_handle, &window, MacOSPanelStatus::Show);
    } else {
        // 偏好设置窗口：重置为默认尺寸并居中
        let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: 1226,
            height: 956,
        }));
        let _ = window.center();
        
        shared_show_window(&window);
    }
}

// 隐藏窗口
#[command]
pub async fn hide_window<R: Runtime>(app_handle: AppHandle<R>, window: WebviewWindow<R>) {
    if is_main_window(&window) {
        set_macos_panel(&app_handle, &window, MacOSPanelStatus::Hide);
    } else {
        shared_hide_window(&window);
    }
}

// 显示任务栏图标
#[command]
pub async fn show_taskbar_icon<R: Runtime>(
    app_handle: AppHandle<R>,
    _window: WebviewWindow<R>,
    visible: bool,
) {
    let _ = app_handle.set_dock_visibility(visible);
}

// 设置 macos 的 ns_panel 的状态
pub fn set_macos_panel<R: Runtime>(
    app_handle: &AppHandle<R>,
    window: &WebviewWindow<R>,
    status: MacOSPanelStatus,
) {
    if is_main_window(window) {
        let app_handle_clone = app_handle.clone();

        let _ = app_handle.run_on_main_thread(move || {
            if let Ok(panel) = app_handle_clone.get_webview_panel(MAIN_WINDOW_LABEL) {
                match status {
                    MacOSPanelStatus::Show => {
                        panel.show_and_make_key();

                        panel.set_collection_behavior(
                            CollectionBehavior::new()
                                .stationary()
                                .can_join_all_spaces()
                                .full_screen_auxiliary()
                                .into(),
                        );
                    }
                    MacOSPanelStatus::Hide => {
                        panel.hide();

                        panel.set_collection_behavior(
                            CollectionBehavior::new()
                                .stationary()
                                .move_to_active_space()
                                .full_screen_auxiliary()
                                .into(),
                        );
                    }
                    MacOSPanelStatus::Resign => {
                        panel.resign_key_window();
                    }
                }
            }
        });
    }
}
