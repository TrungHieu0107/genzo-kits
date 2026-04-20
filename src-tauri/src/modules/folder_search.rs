use serde::Serialize;
use std::fs;
use std::path::PathBuf;

#[derive(Serialize)]
pub struct SearchResultItem {
    pub path: String,
    pub name: String,
    pub base_path: String,
    pub modified: String,
    pub is_dir: bool,
}

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
        let pattern = if is_glob_pattern(input) { glob_to_regex(input) } else { input.to_string() };
        regex::Regex::new(&pattern).map_err(|e| format!("Invalid Regex: {}", e))
    } else {
        let escaped = regex::escape(input);
        regex::Regex::new(&escaped).map_err(|e| e.to_string())
    }
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

#[tauri::command]
pub async fn search_system(
    roots: Vec<String>,
    query: String,
    mode: String,
    use_regex: bool,
) -> Result<Vec<SearchResultItem>, String> {
    let re = build_regex(&query, use_regex)?;
    let actual_roots: Vec<PathBuf> = roots.iter().filter(|r| !r.trim().is_empty()).map(PathBuf::from).collect();
    if actual_roots.is_empty() { return Err("Please specify at least one target directory to search.".to_string()); }

    tauri::async_runtime::spawn_blocking(move || {
        let mut results = Vec::new();
        let query_lower = query.to_lowercase();
        let limit = 1000;
        for root_path in actual_roots {
            if results.len() >= limit { break; }
            let mut stack = vec![root_path];
            while let Some(current_path) = stack.pop() {
                if results.len() >= limit { break; }
                let entries = match fs::read_dir(&current_path) { Ok(e) => e, Err(_) => continue };
                for entry in entries.flatten() {
                    if let Ok(metadata) = entry.metadata() {
                        let is_dir = metadata.is_dir();
                        let path = entry.path();
                        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                            let matches_query = if use_regex { re.is_match(name) } else { name.to_lowercase().contains(&query_lower) };
                            let matches_mode = match mode.as_str() { "file" => !is_dir, "folder" => is_dir, _ => true };
                            if matches_query && matches_mode {
                                let modified_str = metadata.modified().ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| format_system_time(d.as_secs())).unwrap_or_else(|| "Unknown".to_string());
                                results.push(SearchResultItem {
                                    path: path.to_string_lossy().to_string(),
                                    name: name.to_string(),
                                    base_path: path.parent().and_then(|p| p.to_str()).unwrap_or("").to_string(),
                                    modified: modified_str,
                                    is_dir,
                                });
                            }
                        }
                        if is_dir { stack.push(path); }
                    }
                }
            }
        }
        Ok(results)
    }).await.map_err(|e| e.to_string())?
}
