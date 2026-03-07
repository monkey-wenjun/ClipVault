use super::{is_main_window, shared_hide_window, shared_show_window};
use tauri::{command, AppHandle, Runtime, WebviewWindow};

const WINDOW_HEIGHT: f64 = 720.0;
const WINDOW_WIDTH_RATIO: f64 = 0.88; // 窗口宽度占屏幕宽度的比例

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
                width: window_width.max(1000), // 最小宽度 1000
                height: WINDOW_HEIGHT as u32,
            }));
            
            // 获取屏幕总高度（包含任务栏区域）
            let screen_height = _size.height as i32;
            let screen_bottom = _position.y + screen_height;
            // 工作区底部（任务栏上方，如果任务栏隐藏则等于屏幕底部）
            let work_area_bottom = work_position.y + work_size.height as i32;
            
            // 计算窗口 Y 位置：紧贴工作区底部（任务栏上方）或屏幕底部（任务栏隐藏时）
            // 如果 work_area_bottom < screen_bottom，说明任务栏在底部
            // 如果 work_area_bottom == screen_bottom，说明任务栏隐藏
            let window_y = work_area_bottom - WINDOW_HEIGHT as i32;
            
            let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                x: window_x,
                y: window_y.max(_position.y), // 确保不会超出屏幕顶部
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
