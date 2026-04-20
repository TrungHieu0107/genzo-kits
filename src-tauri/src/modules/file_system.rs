use encoding_rs::Encoding;
use std::fs::File;
use std::io::Read;
use serde::Serialize;

#[derive(Serialize)]
pub struct SafeFileResponse {
    pub content: Option<String>,
    pub is_binary: bool,
    pub error: Option<String>,
}

const MAX_READ_SIZE: usize = 20 * 1024 * 1024; // 20 MB

#[tauri::command]
pub async fn read_file_encoded(
    path: String,
    encoding: Option<String>,
) -> Result<SafeFileResponse, String> {
    let metadata = match std::fs::metadata(&path) {
        Ok(m) => m,
        Err(e) => {
            return Ok(SafeFileResponse {
                content: None,
                is_binary: false,
                error: Some(e.to_string()),
            })
        }
    };

    if metadata.len() > MAX_READ_SIZE as u64 {
        return Ok(SafeFileResponse {
            content: None,
            is_binary: false,
            error: Some(format!("File is too large ({} MB). Max limit is 20 MB.", metadata.len() / 1024 / 1024)),
        });
    }

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

    let mut buffer = Vec::with_capacity(metadata.len() as usize);
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
pub async fn save_file_encoded(
    path: String,
    content: String,
    encoding: String,
) -> Result<(), String> {
    let enc = Encoding::for_label(encoding.as_bytes()).unwrap_or(encoding_rs::UTF_8);
    let (bytes, _, _) = enc.encode(&content);
    std::fs::write(path, bytes).map_err(|e| e.to_string())
}
