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

                                // Emit progress mỗi 10000 entries, commit batch (inside loop to catch exact multiples)
                                if count % 10000 == 0 {
                                    let _ = conn.execute_batch("COMMIT; BEGIN TRANSACTION;");
                                    let _ = app_handle.emit("index-progress", count);
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

        if use_regex {
            // Đăng ký custom function REGEXP để lọc trên SQLite (zero RAM overhead)
            let re = regex::Regex::new(&query).map_err(|e| format!("Invalid Regex: {}", e))?;
            conn.create_scalar_function(
                "regexp",
                2,
                rusqlite::functions::FunctionFlags::SQLITE_UTF8 | rusqlite::functions::FunctionFlags::SQLITE_DETERMINISTIC,
                move |ctx| {
                    let text = ctx.get::<String>(1)?;
                    Ok(re.is_match(&text))
                },
            ).map_err(|e| e.to_string())?;
        }

        let sql = if use_regex {
            format!("SELECT name, path, is_dir, modified FROM files WHERE name REGEXP ?1 {} LIMIT ?2", mode_filter)
        } else {
            format!("SELECT name, path, is_dir, modified FROM files WHERE name LIKE ?1 {} LIMIT ?2", mode_filter)
        };

        let like_pattern = if !use_regex {
            if query.contains('*') || query.contains('?') {
                query.replace('*', "%").replace('?', "_")
            } else {
                format!("%{}%", query)
            }
        } else {
            String::new()
        };

        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let rows = stmt.query_map(rusqlite::params![if use_regex { "" } else { &like_pattern }, limit], |row| {
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
        for row in rows.flatten() {
            results.push(row);
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
// ===== Property Renamer =====

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct ScanOccurrence {
    pub file_path: String,
    pub line_number: usize,
    pub line_content: String,
    pub match_type: String,
}

#[derive(serde::Serialize)]
pub struct ScanResult {
    pub old_name: String,
    pub occurrences: Vec<ScanOccurrence>,
}

#[derive(serde::Deserialize)]
pub struct RenameMapping {
    pub old_name: String,
    pub new_name: String,
}

#[derive(serde::Serialize)]
pub struct ReplaceResult {
    pub files_modified: usize,
    pub total_replacements: usize,
    pub errors: Vec<String>,
}

#[derive(serde::Serialize)]
pub struct UndoResult {
    pub files_restored: usize,
    pub errors: Vec<String>,
}

#[tauri::command]
async fn collect_files(root: String) -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut results = Vec::new();
        let mut stack = vec![std::path::PathBuf::from(&root)];
        while let Some(dir) = stack.pop() {
            let entries = match std::fs::read_dir(&dir) {
                Ok(e) => e,
                Err(_) => continue,
            };
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    stack.push(path);
                } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    if ext_lower == "jsp" || ext_lower == "java" || ext_lower == "js" {
                        if let Some(p) = path.to_str() {
                            results.push(p.to_string());
                        }
                    }
                }
            }
        }
        results.sort();
        Ok(results)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Read file content with encoding detection (UTF-8 fallback to Shift_JIS)
fn read_file_with_encoding(path: &str) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| format!("{}: {}", path, e))?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf).map_err(|e| format!("{}: {}", path, e))?;

    // Try UTF-8 first
    match String::from_utf8(buf.clone()) {
        Ok(s) => Ok(s),
        Err(_) => {
            // Fallback: try Shift_JIS / Windows-31J
            let (cow, _, had_errors) = encoding_rs::SHIFT_JIS.decode(&buf);
            if !had_errors {
                Ok(cow.into_owned())
            } else {
                // Last resort: lossy UTF-8
                Ok(String::from_utf8_lossy(&buf).into_owned())
            }
        }
    }
}

#[tauri::command]
async fn scan_files(paths: Vec<String>) -> Result<Vec<ScanResult>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        use std::collections::HashMap;

        // Regex patterns
        let re_jsp_property = regex::Regex::new(r#"property\s*=\s*['"]([^'"]+)['"]"#).unwrap();
        let re_jsp_name = regex::Regex::new(r#"name\s*=\s*['"]([^'"]+)['"]"#).unwrap();
        let re_java_getter = regex::Regex::new(r"\.get([A-Z][a-zA-Z]*)\(\)").unwrap();
        let re_java_setter = regex::Regex::new(r"\.set([A-Z][a-zA-Z]*)\(").unwrap();
        let re_java_string = regex::Regex::new(r#""([a-z][a-zA-Z_]{3,})""#).unwrap();
        let re_js_getelem = regex::Regex::new(r#"getElementById\(\s*['"]([^'"]+)['"]\s*\)"#).unwrap();
        let re_js_this_getelem = regex::Regex::new(r#"this_getElementById\(\s*['"]([^'"]+)['"]\s*\)"#).unwrap();
        let re_js_value = regex::Regex::new(r"\.([a-zA-Z_]+)\.value").unwrap();

        let mut map: HashMap<String, Vec<ScanOccurrence>> = HashMap::new();

        for file_path in &paths {
            let content = match read_file_with_encoding(file_path) {
                Ok(c) => c,
                Err(_) => continue,
            };

            let ext = std::path::Path::new(file_path)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_lowercase();

            for (line_num, line) in content.lines().enumerate() {
                let line_number = line_num + 1;

                if ext == "jsp" {
                    // JSP: property='...'
                    for cap in re_jsp_property.captures_iter(line) {
                        let name = cap[1].to_string();
                        map.entry(name.clone()).or_default().push(ScanOccurrence {
                            file_path: file_path.clone(),
                            line_number,
                            line_content: line.to_string(),
                            match_type: "jsp_property".to_string(),
                        });
                    }
                    // JSP: name='...' (inside fvo:* or input tags)
                    if line.contains("fvo:") || line.to_lowercase().contains("<input") {
                        for cap in re_jsp_name.captures_iter(line) {
                            let name = cap[1].to_string();
                            map.entry(name.clone()).or_default().push(ScanOccurrence {
                                file_path: file_path.clone(),
                                line_number,
                                line_content: line.to_string(),
                                match_type: "jsp_name".to_string(),
                            });
                        }
                    }
                } else if ext == "java" {
                    // Java: getter
                    for cap in re_java_getter.captures_iter(line) {
                        let method_part = cap[1].to_string();
                        // Convert PascalCase to camelCase for the property name
                        let name = {
                            let mut chars = method_part.chars();
                            match chars.next() {
                                Some(c) => c.to_lowercase().to_string() + chars.as_str(),
                                None => method_part.clone(),
                            }
                        };
                        map.entry(name.clone()).or_default().push(ScanOccurrence {
                            file_path: file_path.clone(),
                            line_number,
                            line_content: line.to_string(),
                            match_type: "java_getter".to_string(),
                        });
                    }
                    // Java: setter
                    for cap in re_java_setter.captures_iter(line) {
                        let method_part = cap[1].to_string();
                        let name = {
                            let mut chars = method_part.chars();
                            match chars.next() {
                                Some(c) => c.to_lowercase().to_string() + chars.as_str(),
                                None => method_part.clone(),
                            }
                        };
                        map.entry(name.clone()).or_default().push(ScanOccurrence {
                            file_path: file_path.clone(),
                            line_number,
                            line_content: line.to_string(),
                            match_type: "java_setter".to_string(),
                        });
                    }
                    // Java: string literals
                    for cap in re_java_string.captures_iter(line) {
                        let name = cap[1].to_string();
                        // Filter out class paths and URLs
                        if !name.contains('.') && !name.contains('/') && !name.contains(':') {
                            map.entry(name.clone()).or_default().push(ScanOccurrence {
                                file_path: file_path.clone(),
                                line_number,
                                line_content: line.to_string(),
                                match_type: "java_string".to_string(),
                            });
                        }
                    }
                } else if ext == "js" {
                    // JS: getElementById
                    for cap in re_js_getelem.captures_iter(line) {
                        let name = cap[1].to_string();
                        map.entry(name.clone()).or_default().push(ScanOccurrence {
                            file_path: file_path.clone(),
                            line_number,
                            line_content: line.to_string(),
                            match_type: "js_getelementbyid".to_string(),
                        });
                    }
                    // JS: this_getElementById
                    for cap in re_js_this_getelem.captures_iter(line) {
                        let name = cap[1].to_string();
                        map.entry(name.clone()).or_default().push(ScanOccurrence {
                            file_path: file_path.clone(),
                            line_number,
                            line_content: line.to_string(),
                            match_type: "js_getelementbyid".to_string(),
                        });
                    }
                    // JS: .name.value
                    for cap in re_js_value.captures_iter(line) {
                        let name = cap[1].to_string();
                        if name.len() > 3 {
                            map.entry(name.clone()).or_default().push(ScanOccurrence {
                                file_path: file_path.clone(),
                                line_number,
                                line_content: line.to_string(),
                                match_type: "js_value".to_string(),
                            });
                        }
                    }
                }
            }
        }

        let mut results: Vec<ScanResult> = map
            .into_iter()
            .map(|(old_name, occurrences)| ScanResult { old_name, occurrences })
            .collect();
        results.sort_by(|a, b| a.old_name.to_lowercase().cmp(&b.old_name.to_lowercase()));

        Ok(results)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn replace_in_files(mappings: Vec<RenameMapping>, paths: Vec<String>, encodings: std::collections::HashMap<String, String>) -> Result<ReplaceResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut files_modified = 0usize;
        let mut total_replacements = 0usize;
        let mut errors: Vec<String> = Vec::new();

        // Filter out empty new_name mappings
        let valid_mappings: Vec<&RenameMapping> = mappings.iter()
            .filter(|m| !m.new_name.trim().is_empty() && m.old_name != m.new_name)
            .collect();

        if valid_mappings.is_empty() {
            return Ok(ReplaceResult { files_modified: 0, total_replacements: 0, errors: vec![] });
        }

        for file_path in &paths {
            let content = match read_file_with_encoding(file_path) {
                Ok(c) => c,
                Err(e) => {
                    errors.push(e);
                    continue;
                }
            };

            let ext = std::path::Path::new(file_path)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_lowercase();

            let mut new_content = content.clone();
            let mut file_replacements = 0usize;

            for mapping in &valid_mappings {
                let old = &mapping.old_name;
                let new = &mapping.new_name;

                let before = new_content.clone();

                if ext == "jsp" {
                    // Replace inside property='old' and name='old'
                    let patterns = vec![
                        format!("property='{}'", old),
                        format!("property=\"{}\"", old),
                        format!("name='{}'", old),
                        format!("name=\"{}\"", old),
                    ];
                    let replacements = vec![
                        format!("property='{}'", new),
                        format!("property=\"{}\"", new),
                        format!("name='{}'", new),
                        format!("name=\"{}\"", new),
                    ];
                    for (p, r) in patterns.iter().zip(replacements.iter()) {
                        new_content = new_content.replace(p, r);
                    }
                } else if ext == "java" {
                    // Capitalize first char for getter/setter method names
                    let old_cap = {
                        let mut chars = old.chars();
                        match chars.next() {
                            Some(c) => c.to_uppercase().to_string() + chars.as_str(),
                            None => old.clone(),
                        }
                    };
                    let new_cap = {
                        let mut chars = new.chars();
                        match chars.next() {
                            Some(c) => c.to_uppercase().to_string() + chars.as_str(),
                            None => new.clone(),
                        }
                    };

                    // Replace getter/setter
                    new_content = new_content.replace(
                        &format!(".get{}()", old_cap),
                        &format!(".get{}()", new_cap),
                    );
                    new_content = new_content.replace(
                        &format!(".set{}(", old_cap),
                        &format!(".set{}(", new_cap),
                    );
                    // Replace string literals "oldName"
                    new_content = new_content.replace(
                        &format!("\"{}\"", old),
                        &format!("\"{}\"", new),
                    );
                } else if ext == "js" {
                    // Replace getElementById('old') patterns
                    let js_patterns = vec![
                        format!("getElementById('{}')", old),
                        format!("getElementById(\"{}\")", old),
                        format!("this_getElementById('{}')", old),
                        format!("this_getElementById(\"{}\")", old),
                    ];
                    let js_replacements = vec![
                        format!("getElementById('{}')", new),
                        format!("getElementById(\"{}\")", new),
                        format!("this_getElementById('{}')", new),
                        format!("this_getElementById(\"{}\")", new),
                    ];
                    for (p, r) in js_patterns.iter().zip(js_replacements.iter()) {
                        new_content = new_content.replace(p, r);
                    }
                    // Replace .oldName.value
                    new_content = new_content.replace(
                        &format!(".{}.value", old),
                        &format!(".{}.value", new),
                    );
                }

                if new_content != before {
                    // Count approximate replacements
                    let diff_count = before.matches(&mapping.old_name).count()
                        .saturating_sub(new_content.matches(&mapping.old_name).count());
                    file_replacements += if diff_count > 0 { diff_count } else { 1 };
                }
            }

            if new_content != content {
                // Create .bak backup
                let bak_path = format!("{}.bak", file_path);
                if let Err(e) = std::fs::write(&bak_path, &content) {
                    errors.push(format!("Backup failed {}: {}", bak_path, e));
                    continue;
                }
                // Write modified content with selected encoding
                let file_encoding = encodings.get(file_path).map(|s| s.as_str()).unwrap_or("UTF-8");
                let write_result = if file_encoding == "UTF-8" {
                    std::fs::write(file_path, &new_content)
                } else {
                    // Use encoding_rs to encode the string to bytes
                    let encoder = Encoding::for_label(file_encoding.as_bytes())
                        .unwrap_or(encoding_rs::UTF_8);
                    let (encoded, _, _) = encoder.encode(&new_content);
                    std::fs::write(file_path, &*encoded)
                };
                if let Err(e) = write_result {
                    errors.push(format!("Write failed {}: {}", file_path, e));
                    continue;
                }
                files_modified += 1;
                total_replacements += file_replacements;
            }
        }

        Ok(ReplaceResult { files_modified, total_replacements, errors })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn undo_last_replace(paths: Vec<String>) -> Result<UndoResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut files_restored = 0usize;
        let mut errors: Vec<String> = Vec::new();

        for file_path in &paths {
            let bak_path = format!("{}.bak", file_path);
            if std::path::Path::new(&bak_path).exists() {
                match std::fs::copy(&bak_path, file_path) {
                    Ok(_) => {
                        let _ = std::fs::remove_file(&bak_path);
                        files_restored += 1;
                    }
                    Err(e) => {
                        errors.push(format!("Restore failed {}: {}", file_path, e));
                    }
                }
            }
        }

        Ok(UndoResult { files_restored, errors })
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
            get_index_status,
            collect_files,
            scan_files,
            replace_in_files,
            undo_last_replace
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
