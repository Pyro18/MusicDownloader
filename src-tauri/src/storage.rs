use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub download_path: Option<String>,
    pub audio_format: String,
    pub audio_quality: String,
    pub use_sponsor_block: bool,
    pub generate_m3u: bool,
    pub generate_lrc: bool,
    pub output_template: String,
    pub threads: u8,
    pub force_update_metadata: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            download_path: None,
            audio_format: "mp3".to_string(),
            audio_quality: "320k".to_string(),
            use_sponsor_block: false,
            generate_m3u: false,
            generate_lrc: false,
            output_template: "{artist} - {title}.{ext}".to_string(),
            threads: 4,
            force_update_metadata: true,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HistoryItem {
    pub id: String,
    pub url: String,
    pub format: String,
    pub quality: String,
    pub status: String,
    pub timestamp: u64,
    pub title: Option<String>,
    pub artist: Option<String>,
}

#[derive(Clone)]
pub struct Storage {
    config_path: PathBuf,
    history_path: PathBuf,
}

impl Storage {
    pub fn new() -> Self {
        let config_dir = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("MusicDownloader");

        if !config_dir.exists() {
            let _ = fs::create_dir_all(&config_dir);
        }

        Self {
            config_path: config_dir.join("settings.json"),
            history_path: config_dir.join("history.json"),
        }
    }

    pub fn load_config(&self) -> AppConfig {
        if let Ok(content) = fs::read_to_string(&self.config_path) {
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            AppConfig::default()
        }
    }

    pub fn save_config(&self, config: &AppConfig) -> Result<(), String> {
        let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
        fs::write(&self.config_path, content).map_err(|e| e.to_string())
    }

    pub fn load_history(&self) -> Vec<HistoryItem> {
        if let Ok(content) = fs::read_to_string(&self.history_path) {
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            Vec::new()
        }
    }

    pub fn save_history(&self, history: &[HistoryItem]) -> Result<(), String> {
        let content = serde_json::to_string_pretty(history).map_err(|e| e.to_string())?;
        fs::write(&self.history_path, content).map_err(|e| e.to_string())
    }
    
    pub fn add_history_item(&self, item: HistoryItem) -> Result<(), String> {
        let mut history = self.load_history();
        // Add to beginning of list
        history.insert(0, item);
        // Keep only the last 100 items
        if history.len() > 100 {
            history.truncate(100);
        }
        self.save_history(&history)
    }
}
