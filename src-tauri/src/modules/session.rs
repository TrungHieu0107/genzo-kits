use tauri::Manager;

#[tauri::command]
pub async fn save_note_session(app: tauri::AppHandle, state_json: String) -> Result<(), String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&path).ok();
    path.push("note_session.json");
    std::fs::write(path, state_json).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn load_note_session(app: tauri::AppHandle) -> Result<String, String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    path.push("note_session.json");
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}
