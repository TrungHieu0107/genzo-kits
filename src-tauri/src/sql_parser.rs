use rayon::prelude::*;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub raw_log: String,
    pub entry_type: String, // "sql" | "info" | "other"
    pub id: Option<String>,
    pub sql: Option<String>,
    pub params_string: Option<String>,
    pub reconstructed_sql: Option<String>,
    pub timestamp: Option<String>,
    pub log_index: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DaoSession {
    pub dao_name: String,
    pub thread_name: String,
    pub logs: Vec<LogEntry>,
}

use std::sync::LazyLock;

static RE_TIMESTAMP: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^\d{4}[/-]\d{2}[/-]\d{2}\s+\d{2}:\d{2}:\d{2}").unwrap());
static RE_START_DAO: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?i)(?:InvokeDao)?.*?,?Daoの開始\s*([\w.]+)").unwrap());
static RE_THREAD: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"threadName=([\w-]+)").unwrap());
static RE_DAO_END: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?i)Daoの終了\s*([\w.]+)").unwrap());
static RE_SESSION_END: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?i)(?:endSession|Daoのセッションを終了します)").unwrap());
static RE_ID: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?i)id=([a-zA-Z0-9_-]+)").unwrap());
static RE_SQL: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?i)sql=([\s\S]*)").unwrap());
static RE_PARAMS: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?is)params=\s*(\[[\s\S]*\]|.*)").unwrap());


#[tauri::command]
pub async fn parse_sql_logs_rust(log_content: String) -> Result<Vec<DaoSession>, String> {
    // 1. Identify entry boundaries
    // We search for the timestamp pattern at the beginning of lines.
    // Instead of a massive regex match, we find all offsets where a line starts with a timestamp.
    let mut offsets = Vec::new();
    let lines: Vec<&str> = log_content.lines().collect();
    let mut current_offset = 0;

    for line in &lines {
        if RE_TIMESTAMP.is_match(line) {
            offsets.push(current_offset);
        }
        current_offset += line.len() + 1; // +1 for newline
    }

    if offsets.is_empty() && !log_content.trim().is_empty() {
        // Handle case where first line might not match but has content
        offsets.push(0);
    }

    // 2. Parse entries in parallel
    let entries: Vec<LogEntry> = (0..offsets.len())
        .into_par_iter()
        .map(|i| {
            let start = offsets[i];
            let end = if i + 1 < offsets.len() { offsets[i+1] } else { log_content.len() };
            let raw_entry = log_content[start..end].trim().to_string();
            
            let timestamp = RE_TIMESTAMP.find(&raw_entry).map(|m| m.as_str().to_string());
            
            let mut entry = LogEntry {
                raw_log: raw_entry.clone(),
                entry_type: "other".to_string(),
                id: None,
                sql: None,
                params_string: None,
                reconstructed_sql: None,
                timestamp,
                log_index: i,
            };

            // Extract ID, SQL, Params
            if let Some(caps) = RE_ID.captures(&raw_entry) {
                entry.id = Some(caps[1].trim().to_lowercase());
                if let Some(sql_caps) = RE_SQL.captures(&raw_entry) {
                    entry.entry_type = "sql".to_string();
                    entry.sql = Some(sql_caps[1].trim().to_string());
                }
                if let Some(params_caps) = RE_PARAMS.captures(&raw_entry) {
                    entry.entry_type = "sql".to_string();
                    entry.params_string = Some(params_caps[1].trim().to_string());
                }
            } else if RE_START_DAO.is_match(&raw_entry) || RE_DAO_END.is_match(&raw_entry) || RE_SESSION_END.is_match(&raw_entry) {
                entry.entry_type = "info".to_string();
            }

            entry
        })
        .collect();

    // 3. Assemble sessions (this part is stateful/sequential per thread)
    // Group entries by thread name first
    let mut sessions: Vec<DaoSession> = Vec::new();
    let mut thread_stacks: HashMap<String, Vec<DaoSession>> = HashMap::new();

    for entry in entries {
        let thread_name = RE_THREAD.captures(&entry.raw_log)
            .map(|c| c[1].to_string())
            .unwrap_or_else(|| "main".to_string());

        // Check for DAO Start
        if let Some(caps) = RE_START_DAO.captures(&entry.raw_log) {
            let full_dao_name = caps[1].to_string();
            let dao_name = full_dao_name.split('.').last().unwrap_or(&full_dao_name).to_string();
            
            let mut new_session = DaoSession {
                dao_name,
                thread_name: thread_name.clone(),
                logs: Vec::new(),
            };
            new_session.logs.push(LogEntry {
                entry_type: "info".to_string(),
                ..entry.clone()
            });
            thread_stacks.entry(thread_name).or_default().push(new_session);
            continue;
        }

        // Determine target thread session
        let target_thread = if thread_stacks.contains_key(&thread_name) && !thread_stacks[&thread_name].is_empty() {
            Some(thread_name)
        } else {
            // Fallback: pick first active thread or unknown
            thread_stacks.keys()
                .find(|k| !thread_stacks[*k].is_empty())
                .cloned()
        };

        // Check for DAO End
        let is_dao_end = RE_DAO_END.is_match(&entry.raw_log);
        let is_session_end = RE_SESSION_END.is_match(&entry.raw_log);

        if is_dao_end || is_session_end {
            if let Some(ref t) = target_thread {
                if let Some(mut finished_session) = thread_stacks.get_mut(t).and_then(|s| s.pop()) {
                    finished_session.logs.push(LogEntry {
                        entry_type: "info".to_string(),
                        ..entry.clone()
                    });
                    sessions.push(finished_session);
                }
            }
            continue;
        }

        // Push to appropriate session stack
        if let Some(ref t) = target_thread {
            if let Some(current_session) = thread_stacks.get_mut(t).and_then(|s| s.last_mut()) {
                current_session.logs.push(entry);
            }
        } else {
            let unknown_thread = "unknown".to_string();
            let stack = thread_stacks.entry(unknown_thread.clone()).or_default();
            if stack.is_empty() {
                stack.push(DaoSession {
                    dao_name: "Unknown/Global".to_string(),
                    thread_name: unknown_thread,
                    logs: Vec::new(),
                });
            }
            stack.last_mut().unwrap().logs.push(entry);
        }
    }

    // Push remaining un-closed sessions
    for (_, mut stack) in thread_stacks {
        while let Some(session) = stack.pop() {
            sessions.push(session);
        }
    }

    // 4. SECOND PASS: Reconstruct SQL queries globally
    let mut global_sql_map = HashMap::new();
    for session in &sessions {
        for log in &session.logs {
            if let (Some(id), Some(sql)) = (&log.id, &log.sql) {
                global_sql_map.insert(id.clone(), sql.clone());
            }
        }
    }

    for session in &mut sessions {
        for log in &mut session.logs {
            if let Some(id) = &log.id {
                if let Some(raw_sql) = global_sql_map.get(id) {
                    if let Some(params) = &log.params_string {
                        log.reconstructed_sql = Some(reconstruct_sql(raw_sql, params));
                    } else if log.sql.is_some() {
                        log.entry_type = "info".to_string();
                        log.reconstructed_sql = None;
                    }
                }
            }
        }
    }

    Ok(sessions)
}

fn reconstruct_sql(sql: &str, params_string: &str) -> String {
    if params_string.is_empty() {
        return sql.to_string();
    }

    let mut param_dict = HashMap::new();
    // Split by '][' but handle potential surrounding brackets
    let param_items: Vec<&str> = params_string.split("][").collect();

    for mut item in param_items {
        item = item.trim().trim_start_matches('[').trim_end_matches(']');
        let parts: Vec<&str> = item.split(':').collect();
        if parts.len() >= 3 {
            let param_type = parts[0].trim();
            let index: usize = parts[1].trim().parse().unwrap_or(0);
            let value = parts[2..].join(":").trim().to_string();

            let mut formatted_value = value;
            if param_type == "STRING" || param_type == "DATE" || param_type == "TIMESTAMP" {
                formatted_value = format!("'{}'", formatted_value.replace("'", "''"));
            } else if param_type == "NULL" || formatted_value.to_uppercase() == "NULL" {
                formatted_value = "NULL".to_string();
            }

            if index > 0 {
                param_dict.insert(index, formatted_value);
            }
        }
    }

    let mut final_sql = String::new();
    let mut question_mark_count = 0;
    
    for c in sql.chars() {
        if c == '?' {
            question_mark_count += 1;
            if let Some(val) = param_dict.get(&question_mark_count) {
                final_sql.push_str(val);
            } else {
                final_sql.push('?');
            }
        } else {
            final_sql.push(c);
        }
    }

    final_sql.trim().to_string()
}
