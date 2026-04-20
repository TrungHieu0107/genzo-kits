use serde::Serialize;
use ignore::{WalkBuilder, WalkState};
use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;
use std::path::Path;
use std::time::UNIX_EPOCH;

#[derive(Serialize, Clone, Debug)]
pub struct SearchResult {
    pub path: String,
    pub name: String,
    pub is_dir: bool,
    pub score: i64,
    pub size_bytes: Option<u64>,
    pub modified: Option<String>,
}

fn format_iso8601(system_time: std::time::SystemTime) -> Option<String> {
    let duration = system_time.duration_since(UNIX_EPOCH).ok()?;
    let secs = duration.as_secs();
    
    // Simple ISO 8601-like format: YYYY-MM-DDTHH:MM:SSZ
    let mut year = 1970;
    let mut days = secs / 86400;
    let remaining_secs = secs % 86400;

    loop {
        let leap = if (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) { 1 } else { 0 };
        let days_in_year = 365 + leap;
        if days < days_in_year {
            let month_days = [31, 28 + leap, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            let mut month = 1;
            for &d in month_days.iter() {
                if days < d {
                    let hour = remaining_secs / 3600;
                    let minute = (remaining_secs % 3600) / 60;
                    let second = remaining_secs % 60;
                    return Some(format!(
                        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
                        year, month, days + 1, hour, minute, second
                    ));
                }
                days -= d;
                month += 1;
            }
            break;
        }
        days -= days_in_year;
        year += 1;
    }
    None
}

#[tauri::command]
pub async fn search_files(
    root: String,
    query: String,
    max_results: usize,
    include_hidden: bool,
) -> Result<Vec<SearchResult>, String> {
    if !Path::new(&root).exists() {
        return Err(format!("Root path does not exist: {}", root));
    }

    let (tx, rx) = std::sync::mpsc::channel();
    let query_clone = query.clone();

    let walker = WalkBuilder::new(root)
        .hidden(!include_hidden)
        .git_ignore(true)
        .threads(rayon::current_num_threads())
        .build_parallel();

    walker.run(|| {
        let query = query_clone.clone();
        let tx = tx.clone();
        let matcher = SkimMatcherV2::default();

        Box::new(move |entry: Result<ignore::DirEntry, ignore::Error>| {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => return WalkState::Continue,
            };

            let path = entry.path();
            
            if let Some(path_str) = path.to_str() {
                let s = path_str.to_lowercase();
                if s.contains("$recycle.bin") || 
                   s.contains("system volume information") || 
                   s.contains(r"windows\winsxs") {
                    return WalkState::Skip;
                }
            }

            let file_name = entry.file_name().to_string_lossy();
            
            if let Some(score) = matcher.fuzzy_match(&file_name, &query) {
                let metadata = entry.metadata().ok();
                let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
                let size_bytes = if is_dir { None } else { metadata.as_ref().map(|m| m.len()) };
                let modified = metadata.and_then(|m| m.modified().ok()).and_then(format_iso8601);

                let result = SearchResult {
                    path: path.to_string_lossy().to_string(),
                    name: file_name.to_string(),
                    is_dir,
                    score,
                    size_bytes,
                    modified,
                };

                let _ = tx.send(result);
            }

            WalkState::Continue
        })
    });

    // Drop the original sender so the receiver can finish
    drop(tx);

    let mut final_results = Vec::new();
    while let Ok(res) = rx.recv() {
        final_results.push(res);
    }
    
    final_results.sort_by(|a, b| b.score.cmp(&a.score));
    
    if final_results.len() > max_results {
        final_results.truncate(max_results);
    }

    Ok(final_results)
}
