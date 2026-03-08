use encoding_rs::Encoding;
use std::fs::File;
use std::io::{Read, Write};
use tauri::Manager;
use tauri::Emitter;

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

fn format_system_time(seconds: u64) -> String {
    let days_since_epoch = seconds / 86400;
    let seconds_into_day = seconds % 86400;
    let hours = seconds_into_day / 3600;
    let minutes = (seconds_into_day % 3600) / 60;

    let mut year = 1970;
    let mut days_left = days_since_epoch;
    
    loop {
        let leap = if (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) { 1 } else { 0 };
        let days_in_year = 365 + leap;
        if days_left < days_in_year {
            let mut month = 1;
            let month_days = [31, 28 + leap, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            for &d in month_days.iter() {
                if days_left < d {
                    return format!("{:04}-{:02}-{:02} {:02}:{:02}", year, month, days_left + 1, hours, minutes);
                }
                days_left -= d;
                month += 1;
            }
            break;
        }
        days_left -= days_in_year;
        year += 1;
    }
    format!("{} (Raw)", seconds)
}

/// Converts a simple glob-like pattern (using * and ?) into a case-insensitive regex.
fn glob_to_regex(glob: &str) -> String {
    let mut regex = String::from("(?i)^"); // Case-insensitive, start of string
    for c in glob.chars() {
        match c {
            '*' => regex.push_str(".*"),
            '?' => regex.push('.'),
            // Escape all other regex special characters
            _ if "^$.|()[]{}+\\".contains(c) => {
                regex.push('\\');
                regex.push(c);
            }
            _ => regex.push(c),
        }
    }
    regex.push('$'); // End of string
    regex
}

#[derive(serde::Serialize)]
pub struct SearchResultItem {
    pub path: String,
    pub name: String,
    pub base_path: String,
    pub modified: String,
    pub is_dir: bool,
}

#[tauri::command]
async fn open_path(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn get_windows_drives() -> Vec<std::path::PathBuf> {
    let mut drives = Vec::new();
    for letter in b'A'..=b'Z' {
        let drive = format!("{}:\\", letter as char);
        let path = std::path::PathBuf::from(&drive);
        if path.exists() {
            drives.push(path);
        }
    }
    drives
}

// ===== System Cache Manager (SQLite) =====

#[derive(serde::Serialize)]
pub struct IndexStatus {
    pub status: String, // "scanning", "ready", "not_found"
    pub count: usize,
}

/// SQLite database path: app_data_dir/system_index.db
fn get_index_db_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&path).ok();
    path.push("system_index.db");
    Ok(path)
}

/// Flag file đánh dấu scan đang chạy
fn get_scanning_flag_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    path.push(".scanning");
    Ok(path)
}

#[tauri::command]
async fn start_background_index(app: tauri::AppHandle) -> Result<(), String> {
    let db_path = get_index_db_path(&app)?;
    let flag_path = get_scanning_flag_path(&app)?;

    // Nếu đang scan thì bỏ qua
    if flag_path.exists() {
        return Ok(());
    }

    // Tạo flag file
    std::fs::write(&flag_path, "scanning").ok();

    let app_handle = app.clone();
    let flag_path_clone = flag_path.clone();

    tauri::async_runtime::spawn_blocking(move || {
        // Mở/tạo SQLite database
        let conn = match rusqlite::Connection::open(&db_path) {
            Ok(c) => c,
            Err(e) => {
                let _ = std::fs::remove_file(&flag_path_clone);
                let _ = app_handle.emit("index-error", e.to_string());
                return;
            }
        };

        // Tạo bảng (drop cũ nếu có để refresh)
        let _ = conn.execute_batch("
            DROP TABLE IF EXISTS files;
            CREATE TABLE files (
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                is_dir INTEGER NOT NULL,
                modified TEXT NOT NULL
            );
        ");

        // Cấu hình SQLite cho performance (bulk insert)
        let _ = conn.execute_batch("
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = OFF;
            PRAGMA cache_size = 10000;
            PRAGMA temp_store = MEMORY;
        ");

        // Lấy toàn bộ drives
        let roots: Vec<std::path::PathBuf>;
        #[cfg(target_os = "windows")]
        {
            roots = get_windows_drives();
        }
        #[cfg(not(target_os = "windows"))]
        {
            roots = vec![std::path::PathBuf::from("/")];
        }

        let mut count: usize = 0;

        // Dùng transaction cho bulk insert (cực nhanh)
        let _ = conn.execute_batch("BEGIN TRANSACTION;");

        for root_path in roots {
            let mut stack = vec![root_path];
            while let Some(current_path) = stack.pop() {
                let dir_entries = match std::fs::read_dir(&current_path) {
                    Ok(e) => e,
                    Err(_) => continue,
                };

                for entry in dir_entries.flatten() {
                    if let Ok(metadata) = entry.metadata() {
                        let is_dir = metadata.is_dir();
                        let path = entry.path();

                        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                            if let Some(path_str) = path.to_str() {
                                let modified_str = metadata.modified().ok()
                                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                    .map(|d| format_system_time(d.as_secs()))
                                    .unwrap_or_else(|| "Unknown".to_string());

                                let _ = conn.execute(
                                    "INSERT INTO files (name, path, is_dir, modified) VALUES (?1, ?2, ?3, ?4)",
                                    rusqlite::params![name, path_str, is_dir as i32, modified_str],
                                );

                                count += 1;
                            }

                            if is_dir {
                                stack.push(path);
                            }
                        }
                    }
                }

                // Emit progress mỗi 10000 entries, commit batch
                if count % 10000 == 0 && count > 0 {
                    let _ = conn.execute_batch("COMMIT; BEGIN TRANSACTION;");
                    let _ = app_handle.emit("index-progress", count);
                }
            }
        }

        // Commit cuối cùng
        let _ = conn.execute_batch("COMMIT;");

        // Tạo index trên cột name để search nhanh
        let _ = conn.execute_batch("CREATE INDEX IF NOT EXISTS idx_name ON files(name);");

        // Xóa flag file
        let _ = std::fs::remove_file(&flag_path_clone);

        // Emit hoàn tất
        let _ = app_handle.emit("index-complete", count);
    });

    Ok(())
}

#[tauri::command]
async fn search_index(
    app: tauri::AppHandle,
    query: String,
    mode: String,
    use_regex: bool,
) -> Result<Vec<SearchResultItem>, String> {
    let db_path = get_index_db_path(&app)?;

    if !db_path.exists() {
        return Ok(Vec::new());
    }

    tauri::async_runtime::spawn_blocking(move || {
        let conn = rusqlite::Connection::open_with_flags(
            &db_path,
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
        ).map_err(|e| e.to_string())?;

        let limit = 500;

        // Xây dựng SQL query dựa trên mode
        let mode_filter = match mode.as_str() {
            "file" => "AND is_dir = 0",
            "folder" => "AND is_dir = 1",
            _ => "", // "all"
        };

        let sql = format!(
            "SELECT name, path, is_dir, modified FROM files WHERE name LIKE ?1 {} LIMIT ?2",
            mode_filter
        );

        // Chuẩn bị pattern cho LIKE
        let like_pattern = if use_regex {
            // Với regex mode, dùng % wildcard rộng rồi lọc phía Rust
            format!("%{}%", query)
        } else if query.contains('*') || query.contains('?') {
            // Chuyển glob sang LIKE pattern
            query.replace('*', "%").replace('?', "_")
        } else {
            format!("%{}%", query)
        };

        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let rows = stmt.query_map(rusqlite::params![like_pattern, limit], |row| {
            let name: String = row.get(0)?;
            let path: String = row.get(1)?;
            let is_dir: bool = row.get::<_, i32>(2)? != 0;
            let modified: String = row.get(3)?;

            // Compute base_path từ path và name
            let base_path = if path.len() > name.len() + 1 {
                path[..path.len() - name.len() - 1].to_string()
            } else {
                String::new()
            };

            Ok(SearchResultItem {
                path,
                name,
                base_path,
                modified,
                is_dir,
            })
        }).map_err(|e| e.to_string())?;

        let mut results = Vec::new();

        if use_regex {
            // Lọc thêm bằng regex phía Rust
            let re = regex::Regex::new(&query).map_err(|e| format!("Invalid Regex: {}", e))?;
            for row in rows.flatten() {
                if re.is_match(&row.name) {
                    results.push(row);
                    if results.len() >= limit as usize {
                        break;
                    }
                }
            }
        } else {
            for row in rows.flatten() {
                results.push(row);
            }
        }

        Ok(results)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn get_index_status(app: tauri::AppHandle) -> Result<IndexStatus, String> {
    let db_path = get_index_db_path(&app)?;
    let flag_path = get_scanning_flag_path(&app)?;

    if flag_path.exists() {
        return Ok(IndexStatus {
            status: "scanning".to_string(),
            count: 0,
        });
    }

    if db_path.exists() {
        // Đọc count từ SQLite (rất nhanh với index)
        let count = tauri::async_runtime::spawn_blocking(move || {
            let conn = rusqlite::Connection::open_with_flags(
                &db_path,
                rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
            ).ok();

            conn.and_then(|c| {
                c.query_row("SELECT COUNT(*) FROM files", [], |row| row.get::<_, usize>(0)).ok()
            }).unwrap_or(0)
        }).await.unwrap_or(0);

        return Ok(IndexStatus {
            status: "ready".to_string(),
            count,
        });
    }

    Ok(IndexStatus {
        status: "not_found".to_string(),
        count: 0,
    })
}

#[tauri::command]
async fn search_system(roots: Vec<String>, query: String, mode: String, use_regex: bool) -> Result<Vec<SearchResultItem>, String> {
    // If using regex, try to compile it first on the main thread so we can fail fast
    // and send a meaningful error back to the UI before spawning the blocking task.
    // If using regex OR if the query contains glob wildcards (* or ?)
    let re = if use_regex {
        match regex::Regex::new(&query) {
            Ok(r) => Some(r),
            Err(e) => {
                let mut msg = format!("Invalid Regex: {}", e);
                if query.contains('*') || query.contains('?') {
                    msg.push_str("\nTip: If you want to use wildcards like '*' or '?', turn OFF Regex mode.");
                }
                return Err(msg);
            }
        }
    } else if query.contains('*') || query.contains('?') {
        // Automatically support glob wildcards in standard mode
        let regex_str = glob_to_regex(&query);
        match regex::Regex::new(&regex_str) {
            Ok(r) => Some(r),
            Err(e) => return Err(format!("Invalid Glob Pattern: {}", e)),
        }
    } else {
        None
    };

    // Determine the actual roots to scan
    let mut actual_roots: Vec<std::path::PathBuf> = roots.iter()
        .filter(|r| !r.trim().is_empty())
        .map(|r| std::path::PathBuf::from(r))
        .collect();

    if actual_roots.is_empty() {
        #[cfg(target_os = "windows")]
        {
            actual_roots = get_windows_drives();
        }
        #[cfg(not(target_os = "windows"))]
        {
            actual_roots.push(std::path::PathBuf::from("/"));
        }
    }

    if actual_roots.is_empty() {
        actual_roots.push(std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from(".")));
    }

    tauri::async_runtime::spawn_blocking(move || {
        let mut results = Vec::new();
        let query_lower = query.to_lowercase();
        let limit = 500;
        
        for root_path in actual_roots {
            if results.len() >= limit {
                break;
            }

            let mut stack = vec![root_path];
            while let Some(current_path) = stack.pop() {
                if results.len() >= limit {
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
                                    let name_str = name.to_string();
                                    let base_path_str = path.parent().and_then(|p| p.to_str()).unwrap_or("").to_string();
                                    
                                    // Format modification time
                                    let modified_str = metadata.modified().ok()
                                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                        .map(|d| {
                                            let secs = d.as_secs();
                                            format_system_time(secs)
                                        })
                                        .unwrap_or_else(|| "Unknown".to_string());

                                    results.push(SearchResultItem {
                                        path: path_str.to_string(),
                                        name: name_str,
                                        base_path: base_path_str,
                                        modified: modified_str,
                                        is_dir,
                                    });
                                }
                            }
                            
                            if is_dir {
                                stack.push(path);
                            }
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
            search_system,
            open_path,
            start_background_index,
            search_index,
            get_index_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
