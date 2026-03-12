use encoding_rs::Encoding;
use std::fs::File;
use std::io::{Read, Write};
use tauri::Manager;

pub mod search;

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
fn glob_to_regex(pattern: &str) -> String {
    let mut regex = String::from("(?i)"); // Case-insensitive
    for ch in pattern.chars() {
        match ch {
            '*' => regex.push_str(".*"),
            '?' => regex.push('.'),
            '.' | '+' | '^' | '$' | '{' | '}' | '|' | '(' | ')' | '[' | ']' | '\\' => {
                regex.push('\\');
                regex.push(ch);
            }
            _ => regex.push(ch),
        }
    }
    regex
}

fn is_glob_pattern(input: &str) -> bool {
    input.contains('*') || input.contains('?')
}

fn build_regex(input: &str, is_regex_mode: bool) -> Result<regex::Regex, String> {
    if is_regex_mode {
        // Nếu trông giống glob thì auto-convert thay vì báo lỗi
        let pattern = if is_glob_pattern(input) {
            glob_to_regex(input)
        } else {
            input.to_string()
        };
        regex::Regex::new(&pattern).map_err(|e| format!("Invalid Regex: {}", e))
    } else {
        // Non-regex mode: escape tất cả special chars
        let escaped = regex::escape(input);
        regex::Regex::new(&escaped).map_err(|e| e.to_string())
    }
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

// ===== System File & Folder Searcher (Live Scan Only) =====



#[tauri::command]
async fn search_system(roots: Vec<String>, query: String, mode: String, use_regex: bool) -> Result<Vec<SearchResultItem>, String> {
    // If using regex, try to compile it first on the main thread so we can fail fast
    // and send a meaningful error back to the UI before spawning the blocking task.
    // If using regex OR if the query contains glob wildcards (* or ?)
    // If using regex OR if the query contains glob wildcards (* or ?)
    let re = match build_regex(&query, use_regex) {
        Ok(r) => Some(r),
        Err(e) => {
            let mut msg = e;
            if use_regex && (query.contains('*') || query.contains('?')) {
                // This case should ideally be handled by build_regex, 
                // but just in case it fails after conversion
                msg.push_str("\nTip: Check your wildcard syntax.");
            } else if !use_regex && (query.contains('*') || query.contains('?')) {
                msg.push_str("\nTip: Invalid glob-like pattern.");
            }
            return Err(msg);
        }
    };

    // Determine the actual roots to scan
    let actual_roots: Vec<std::path::PathBuf> = roots.iter()
        .filter(|r| !r.trim().is_empty())
        .map(|r| std::path::PathBuf::from(r))
        .collect();

    if actual_roots.is_empty() {
        return Err("Please specify at least one target directory to search.".to_string());
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

#[tauri::command]
async fn fetch_url_content(url: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let client = reqwest::blocking::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .user_agent("Genzo-Kit/1.0.0")
            .build()
            .map_err(|e| format!("Failed to build client: {}", e))?;

        let response = client.get(&url)
            .send()
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Server returned error: {}", response.status()));
        }

        let content = response.text()
            .map_err(|e| format!("Failed to read response body: {}", e))?;

        Ok(content)
    })
    .await
    .map_err(|e| format!("Thread pool error: {}", e))?
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
            collect_files,
            scan_files,
            replace_in_files,
            undo_last_replace,
            fetch_url_content,
            search::search_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
