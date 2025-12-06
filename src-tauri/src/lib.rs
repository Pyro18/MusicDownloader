mod commands;
mod storage;

use std::sync::Mutex;
use storage::Storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let storage = Storage::new();

    tauri::Builder::default()
        .manage(Mutex::new(storage))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::download_track,
            commands::check_spotdl_installed,
            commands::install_spotdl,
            commands::open_downloads_folder,
            commands::get_config,
            commands::save_config,
            commands::get_history,
            commands::clear_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
