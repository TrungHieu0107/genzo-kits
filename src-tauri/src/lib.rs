pub mod search;
pub mod sql_parser;
pub mod modules;
pub mod xml_filter;


use modules::base::*;
use modules::file_system::*;
use modules::session::*;
use modules::property_renamer::*;
use modules::network::*;
use modules::folder_search::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            read_file_encoded,
            save_file_encoded,
            save_note_session,
            load_note_session,
            search_system,
            open_path,
            collect_files,
            scan_files,
            replace_in_files,
            undo_last_replace,
            fetch_url_content,
            sql_parser::parse_sql_logs_rust,
            xml_filter::parse_xml_file,
            xml_filter::filter_xml_nodes
        ])

        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
