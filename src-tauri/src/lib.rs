use encoding_rs::Encoding;
use std::fs::File;
use std::io::{Read, Write};
use tauri::Manager;

#[tauri::command]
async fn save_note_session(app: tauri::AppHandle, state_json: String) -> Result<(), String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&path).ok();
    path.push("note_session.json");
    std::fs::write(path, state_json).map_err(|e| e.to_string())
}

#[tauri::command]
async fn load_note_session(app: tauri::AppHandle) -> Result<String, String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    path.push("note_session.json");
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

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
async fn read_file_encoded(
    path: String,
    encoding: Option<String>,
) -> Result<SafeFileResponse, String> {
    let mut file = match File::open(&path) {
        Ok(f) => f,
        Err(e) => {
            return Ok(SafeFileResponse {
                content: None,
                is_binary: false,
                error: Some(e.to_string()),
            })
        }
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

    let enc_name = encoding.unwrap_or_else(|| "UTF-8".to_string());
    let enc = Encoding::for_label(enc_name.as_bytes()).unwrap_or(encoding_rs::UTF_8);
    let (cow, _, _) = enc.decode(&buffer);

    Ok(SafeFileResponse {
        content: Some(cow.into_owned()),
        is_binary: false,
        error: None,
    })
}

#[tauri::command]
async fn save_file_encoded(
    path: String,
    content: String,
    encoding: Option<String>,
) -> Result<bool, String> {
    let enc_name = encoding.unwrap_or_else(|| "UTF-8".to_string());
    let enc = Encoding::for_label(enc_name.as_bytes()).unwrap_or(encoding_rs::UTF_8);

    let (cow, _, _) = enc.encode(&content);

    let mut file = match File::create(&path) {
        Ok(f) => f,
        Err(e) => return Err(e.to_string()),
    };

    if let Err(e) = file.write_all(&cow) {
        return Err(e.to_string());
    }

    Ok(true)
}

#[derive(serde::Serialize)]
pub struct SearchResultItem {
    pub path: String,
    pub is_dir: bool,
}

#[tauri::command]
async fn search_system(root: String, query: String, mode: String, use_regex: bool) -> Result<Vec<SearchResultItem>, String> {
    // If using regex, try to compile it first on the main thread so we can fail fast
    // and send a meaningful error back to the UI before spawning the blocking task.
    let re = if use_regex {
        match regex::Regex::new(&query) {
            Ok(r) => Some(r),
            Err(e) => return Err(format!("Invalid Regex: {}", e)),
        }
    } else {
        None
    };

    tauri::async_runtime::spawn_blocking(move || {
        let mut results = Vec::new();
        let query_lower = query.to_lowercase();
        
        let mut stack = vec![std::path::PathBuf::from(root)];
        
        while let Some(current_path) = stack.pop() {
            // Respect a reasonable limit to prevent unbounded memory growth if querying C:\
            if results.len() >= 500 {
                break; 
            }

            let entries = match std::fs::read_dir(&current_path) {
                Ok(e) => e,
                Err(_) => continue, // Skip folders we don't have permission to read
            };

            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    let is_dir = metadata.is_dir();
                    let path = entry.path();
                    
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        // Check match condition based on regex or standard contains
                        let matches_query = if let Some(ref regex) = re {
                            regex.is_match(name)
                        } else {
                            name.to_lowercase().contains(&query_lower)
                        };
                        
                        // Check mode condition
                        let matches_mode = match mode.as_str() {
                            "file" => !is_dir,
                            "folder" => is_dir,
                            _ => true, // "all"
                        };

                        if matches_query && matches_mode {
                            if let Some(path_str) = path.to_str() {
                                results.push(SearchResultItem {
                                    path: path_str.to_string(),
                                    is_dir,
                                });
                            }
                        }
                        
                        // Always continue searching deeper if it's a directory,
                        // even if it didn't match the query itself
                        if is_dir {
                            stack.push(path);
                        }
                    }
                }
            }
        }
        
        Ok(results)
    })
    .await
    .map_err(|e| e.to_string())?
}

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
            search_system
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
