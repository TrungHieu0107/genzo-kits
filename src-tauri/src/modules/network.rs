#[tauri::command]
pub async fn fetch_url_content(url: String) -> Result<String, String> {
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
