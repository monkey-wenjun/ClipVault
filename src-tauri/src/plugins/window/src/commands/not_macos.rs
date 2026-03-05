use super::{is_main_window, shared_hide_window, shared_show_window};
use tauri::{command, AppHandle, Runtime, WebviewWindow};

const WINDOW_HEIGHT: f64 = 600.0;
const WINDOW_WIDTH_RATIO: f64 = 0.85; // 窗口宽度占屏幕宽度的比例

// 显示窗口
#[command]
pub async fn show_window<R: Runtime>(_app_handle: AppHandle<R>, window: WebviewWindow<R>) {
    // 只有主窗口才应用特殊的布局和尺寸
    if is_main_window(&window) {
        // 获取主显示器信息
        if let Some(monitor) = window.current_monitor().ok().flatten() {
            let _size = monitor.size();
            let _position = monitor.position();
            
            // 获取工作区域（排除任务栏等系统占用区域）
            let work_area = monitor.work_area();
            let work_size = work_area.size;
            let work_position = work_area.position;
            
            // 计算窗口宽度（工作区域宽度的 85%，两侧保留空隙）
            let window_width = (work_size.width as f64 * WINDOW_WIDTH_RATIO) as u32;
            let window_x = work_position.x + ((work_size.width - window_width) as i32 / 2);
            
            // 设置窗口尺寸
            let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: window_width,
                height: WINDOW_HEIGHT as u32,
            }));
            
            // 设置窗口位置：紧贴着工作区域底部（任务栏上方）
            let window_y = work_position.y + (work_size.height as i32) - (WINDOW_HEIGHT as i32);
            
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                x: window_x,
                y: window_y,
            }));
        }
    } else {
        // 偏好设置窗口：重置为默认尺寸并居中
        let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: 1226,
            height: 956,
        }));
        let _ = window.center();
    }
    
    shared_show_window(&window);
}

// 隐藏窗口
#[command]
pub async fn hide_window<R: Runtime>(_app_handle: AppHandle<R>, window: WebviewWindow<R>) {
    shared_hide_window(&window);
}

// 显示任务栏图标
#[command]
pub async fn show_taskbar_icon<R: Runtime>(
    _app_handle: AppHandle<R>,
    window: WebviewWindow<R>,
    visible: bool,
) {
    let _ = window.set_skip_taskbar(!visible);
}
