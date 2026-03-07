use std::fs::File;
use std::io::Read;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(serde::Serialize)]
pub struct SafeFileResponse {
    pub content: Option<String>,
    pub is_binary: bool,
    pub error: Option<String>,
}

#[tauri::command]
async fn read_file_safe(path: String) -> Result<SafeFileResponse, String> {
    let mut file = match File::open(&path) {
        Ok(f) => f,
        Err(e) => return Ok(SafeFileResponse {
            content: None,
            is_binary: false,
            error: Some(e.to_string()),
        }),
    };

    let mut buffer = Vec::new();
    if let Err(e) = file.read_to_end(&mut buffer) {
        return Ok(SafeFileResponse {
            content: None,
            is_binary: false,
            error: Some(e.to_string()),
        });
    }

    // Basic binary check: look for null bytes
    let is_binary = buffer.iter().any(|&b| b == 0);

    if is_binary {
        return Ok(SafeFileResponse {
            content: None,
            is_binary: true,
            error: None,
        });
    }

    // Convert to String, replacing invalid utf-8 sequences
    let content = String::from_utf8_lossy(&buffer).into_owned();

    Ok(SafeFileResponse {
        content: Some(content),
        is_binary: false,
        error: None,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, read_file_safe])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
