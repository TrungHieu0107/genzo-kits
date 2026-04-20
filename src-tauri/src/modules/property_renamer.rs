use serde::{Deserialize, Serialize};
use walkdir::WalkDir;
use std::io::Read;
use std::fs::File;
use encoding_rs::Encoding;
use rayon::prelude::*;
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
pub struct ScanResult {
    pub old_name: String,
    pub occurrences: Vec<ScanOccurrence>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ScanOccurrence {
    pub file_path: String,
    pub line_number: usize,
    pub line_content: String,
    pub match_type: String,
}

#[derive(Serialize, Deserialize)]
pub struct RenameMapping {
    pub old_name: String,
    pub new_name: String,
}

#[derive(Serialize)]
pub struct ReplaceResult {
    pub files_modified: usize,
    pub total_replacements: usize,
    pub errors: Vec<String>,
}

#[derive(Serialize)]
pub struct UndoResult {
    pub files_restored: usize,
    pub errors: Vec<String>,
}

const MAX_READ_SIZE: usize = 20 * 1024 * 1024; // 20 MB

fn read_file_with_encoding(path: &str) -> Result<String, String> {
    let metadata = std::fs::metadata(path).map_err(|e| format!("{}: {}", path, e))?;
    if metadata.len() > MAX_READ_SIZE as u64 {
        return Err(format!("{}: File too large (limit 20MB)", path));
    }

    let mut file = File::open(path).map_err(|e| format!("{}: {}", path, e))?;
    let mut buf = Vec::with_capacity(metadata.len() as usize);
    file.read_to_end(&mut buf).map_err(|e| format!("{}: {}", path, e))?;

    match String::from_utf8(buf.clone()) {
        Ok(s) => Ok(s),
        Err(_) => {
            let (cow, _, had_errors) = encoding_rs::SHIFT_JIS.decode(&buf);
            if !had_errors {
                Ok(cow.into_owned())
            } else {
                Ok(String::from_utf8_lossy(&buf).into_owned())
            }
        }
    }
}

#[tauri::command]
pub async fn collect_files(root: String) -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut paths = Vec::new();
        for entry in WalkDir::new(root).follow_links(false).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let path_str = entry.path().to_string_lossy().to_string();
                let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
                if ["jsp", "java", "js"].contains(&ext) {
                    paths.push(path_str);
                }
            }
        }
        Ok(paths)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn scan_files(paths: Vec<String>) -> Result<Vec<ScanResult>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let re_jsp_property = regex::Regex::new(r#"property\s*=\s*['"]([^'"]+)['"]"#).unwrap();
        let re_jsp_name = regex::Regex::new(r#"name\s*=\s*['"]([^'"]+)['"]"#).unwrap();
        let re_java_getter = regex::Regex::new(r"\.get([A-Z][a-zA-Z]*)\(\)").unwrap();
        let re_java_setter = regex::Regex::new(r"\.set([A-Z][a-zA-Z]*)\(").unwrap();
        let re_java_string = regex::Regex::new(r#""([a-z][a-zA-Z_]{3,})""#).unwrap();
        let re_js_getelem = regex::Regex::new(r#"getElementById\(\s*['"]([^'"]+)['"]\s*\)"#).unwrap();
        let re_js_this_getelem = regex::Regex::new(r#"this_getElementById\(\s*['"]([^'"]+)['"]\s*\)"#).unwrap();
        let re_js_value = regex::Regex::new(r"\.([a-zA-Z_]+)\.value").unwrap();

        let partial_maps: Vec<HashMap<String, Vec<ScanOccurrence>>> = paths.par_iter().map(|file_path| {
            let mut local_map: HashMap<String, Vec<ScanOccurrence>> = HashMap::new();
            let content = match read_file_with_encoding(file_path) {
                Ok(c) => c,
                Err(_) => return local_map,
            };

            let ext = std::path::Path::new(file_path).extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();

            for (line_num, line) in content.lines().enumerate() {
                let line_number = line_num + 1;
                if ext == "jsp" {
                    for cap in re_jsp_property.captures_iter(line) {
                        local_map.entry(cap[1].to_string()).or_default().push(ScanOccurrence {
                            file_path: file_path.clone(), line_number, line_content: line.to_string(), match_type: "jsp_property".to_string(),
                        });
                    }
                    if line.contains("fvo:") || line.to_lowercase().contains("<input") {
                        for cap in re_jsp_name.captures_iter(line) {
                            local_map.entry(cap[1].to_string()).or_default().push(ScanOccurrence {
                                file_path: file_path.clone(), line_number, line_content: line.to_string(), match_type: "jsp_name".to_string(),
                            });
                        }
                    }
                } else if ext == "java" {
                    for cap in re_java_getter.captures_iter(line) {
                        let method_part = cap[1].to_string();
                        let name = {
                            let mut chars = method_part.chars();
                            match chars.next() { Some(c) => c.to_lowercase().to_string() + chars.as_str(), None => method_part.clone() }
                        };
                        local_map.entry(name).or_default().push(ScanOccurrence {
                            file_path: file_path.clone(), line_number, line_content: line.to_string(), match_type: "java_getter".to_string(),
                        });
                    }
                    for cap in re_java_setter.captures_iter(line) {
                        let method_part = cap[1].to_string();
                        let name = {
                            let mut chars = method_part.chars();
                            match chars.next() { Some(c) => c.to_lowercase().to_string() + chars.as_str(), None => method_part.clone() }
                        };
                        local_map.entry(name).or_default().push(ScanOccurrence {
                            file_path: file_path.clone(), line_number, line_content: line.to_string(), match_type: "java_setter".to_string(),
                        });
                    }
                    for cap in re_java_string.captures_iter(line) {
                        let name = cap[1].to_string();
                        if !name.contains('.') && !name.contains('/') && !name.contains(':') {
                            local_map.entry(name).or_default().push(ScanOccurrence {
                                file_path: file_path.clone(), line_number, line_content: line.to_string(), match_type: "java_string".to_string(),
                            });
                        }
                    }
                } else if ext == "js" {
                    for cap in re_js_getelem.captures_iter(line) {
                        local_map.entry(cap[1].to_string()).or_default().push(ScanOccurrence {
                            file_path: file_path.clone(), line_number, line_content: line.to_string(), match_type: "js_getelementbyid".to_string(),
                        });
                    }
                    for cap in re_js_this_getelem.captures_iter(line) {
                        local_map.entry(cap[1].to_string()).or_default().push(ScanOccurrence {
                            file_path: file_path.clone(), line_number, line_content: line.to_string(), match_type: "js_getelementbyid".to_string(),
                        });
                    }
                    for cap in re_js_value.captures_iter(line) {
                        let name = cap[1].to_string();
                        if name.len() > 3 {
                            local_map.entry(name).or_default().push(ScanOccurrence {
                                file_path: file_path.clone(), line_number, line_content: line.to_string(), match_type: "js_value".to_string(),
                            });
                        }
                    }
                }
            }
            local_map
        }).collect();

        let mut map: HashMap<String, Vec<ScanOccurrence>> = HashMap::new();
        for partial in partial_maps {
            for (key, val) in partial { map.entry(key).or_default().extend(val); }
        }

        let mut results: Vec<ScanResult> = map.into_iter().map(|(old_name, occurrences)| ScanResult { old_name, occurrences }).collect();
        results.sort_by(|a, b| a.old_name.to_lowercase().cmp(&b.old_name.to_lowercase()));
        Ok(results)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn replace_in_files(mappings: Vec<RenameMapping>, paths: Vec<String>, encodings: HashMap<String, String>) -> Result<ReplaceResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut files_modified = 0usize;
        let mut total_replacements = 0usize;
        let mut errors: Vec<String> = Vec::new();
        let valid_mappings: Vec<&RenameMapping> = mappings.iter().filter(|m| !m.new_name.trim().is_empty() && m.old_name != m.new_name).collect();

        if valid_mappings.is_empty() { return Ok(ReplaceResult { files_modified: 0, total_replacements: 0, errors: vec![] }); }

        for file_path in &paths {
            let content = match read_file_with_encoding(file_path) { Ok(c) => c, Err(e) => { errors.push(e); continue; } };
            let ext = std::path::Path::new(file_path).extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
            let mut new_content = content.clone();
            let mut file_replacements = 0usize;

            for mapping in &valid_mappings {
                let old = &mapping.old_name;
                let new = &mapping.new_name;
                let before = new_content.clone();

                if ext == "jsp" {
                    let patterns = vec![format!("property='{}'", old), format!("property=\"{}\"", old), format!("name='{}'", old), format!("name=\"{}\"", old)];
                    let replacements = vec![format!("property='{}'", new), format!("property=\"{}\"", new), format!("name='{}'", new), format!("name=\"{}\"", new)];
                    for (p, r) in patterns.iter().zip(replacements.iter()) { new_content = new_content.replace(p, r); }
                } else if ext == "java" {
                    let old_cap = { let mut chars = old.chars(); match chars.next() { Some(c) => c.to_uppercase().to_string() + chars.as_str(), None => old.clone() } };
                    let new_cap = { let mut chars = new.chars(); match chars.next() { Some(c) => c.to_uppercase().to_string() + chars.as_str(), None => new.clone() } };
                    new_content = new_content.replace(&format!(".get{}()", old_cap), &format!(".get{}()", new_cap));
                    new_content = new_content.replace(&format!(".set{}(", old_cap), &format!(".set{}(", new_cap));
                    new_content = new_content.replace(&format!("\"{}\"", old), &format!("\"{}\"", new));
                } else if ext == "js" {
                    let js_patterns = vec![format!("getElementById('{}')", old), format!("getElementById(\"{}\")", old), format!("this_getElementById('{}')", old), format!("this_getElementById(\"{}\")", old)];
                    let js_replacements = vec![format!("getElementById('{}')", new), format!("getElementById(\"{}\")", new), format!("this_getElementById('{}')", new), format!("this_getElementById(\"{}\")", new)];
                    for (p, r) in js_patterns.iter().zip(js_replacements.iter()) { new_content = new_content.replace(p, r); }
                    new_content = new_content.replace(&format!(".{}.value", old), &format!(".{}.value", new));
                }

                if new_content != before {
                    let diff_count = before.matches(&mapping.old_name).count().saturating_sub(new_content.matches(&mapping.old_name).count());
                    file_replacements += if diff_count > 0 { diff_count } else { 1 };
                }
            }

            if new_content != content {
                let bak_path = format!("{}.bak", file_path);
                if let Err(e) = std::fs::write(&bak_path, &content) { errors.push(format!("Backup failed {}: {}", bak_path, e)); continue; }
                let file_encoding = encodings.get(file_path).map(|s| s.as_str()).unwrap_or("UTF-8");
                let write_result = if file_encoding == "UTF-8" { std::fs::write(file_path, &new_content) } else {
                    let encoder = Encoding::for_label(file_encoding.as_bytes()).unwrap_or(encoding_rs::UTF_8);
                    let (encoded, _, _) = encoder.encode(&new_content);
                    std::fs::write(file_path, &*encoded)
                };
                if let Err(e) = write_result { errors.push(format!("Write failed {}: {}", file_path, e)); continue; }
                files_modified += 1; total_replacements += file_replacements;
            }
        }
        Ok(ReplaceResult { files_modified, total_replacements, errors })
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn undo_last_replace(paths: Vec<String>) -> Result<UndoResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut files_restored = 0usize;
        let mut errors: Vec<String> = Vec::new();
        for file_path in &paths {
            let bak_path = format!("{}.bak", file_path);
            if std::path::Path::new(&bak_path).exists() {
                match std::fs::copy(&bak_path, file_path) {
                    Ok(_) => { let _ = std::fs::remove_file(&bak_path); files_restored += 1; }
                    Err(e) => { errors.push(format!("Restore failed {}: {}", file_path, e)); }
                }
            }
        }
        Ok(UndoResult { files_restored, errors })
    }).await.map_err(|e| e.to_string())?
}
