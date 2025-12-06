use tauri::{Emitter, Window, State};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::sync::Mutex;
use serde::Serialize;
use crate::storage::{Storage, AppConfig, HistoryItem};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Clone, Serialize)]
struct ProgressPayload {
    percentage: u32,
    message: String,
}

fn resolve_spotdl_path() -> Option<String> {
    println!("Resolving spotdl path...");

    // Check if spotdl is in PATH
    let mut cmd = Command::new("spotdl");
    cmd.arg("--version");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    if let Ok(output) = cmd.output() {
        if output.status.success() {
            println!("Found spotdl in PATH");
            return Some("spotdl".to_string());
        }
    }

    // Locate via pip
    println!("Checking pip show spotdl...");
    let mut cmd = Command::new("pip");
    cmd.arg("show").arg("spotdl");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    if let Ok(output) = cmd.output() {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if line.starts_with("Location: ") {
                    let location = line.trim_start_matches("Location: ").trim();
                    println!("pip says spotdl is at: {}", location);
                    let path = PathBuf::from(location);
                    
                    // Check standard system install location
                    if let Some(lib_dir) = path.parent() {
                        if let Some(python_dir) = lib_dir.parent() {
                            #[cfg(target_os = "windows")]
                            let candidates = vec![
                                python_dir.join("Scripts").join("spotdl.exe"),
                                python_dir.join("Scripts").join("spotdl"),
                            ];
                            #[cfg(not(target_os = "windows"))]
                            let candidates = vec![
                                python_dir.join("bin").join("spotdl"),
                            ];

                            for candidate in &candidates {
                                println!("Checking candidate A: {:?}", candidate);
                                if candidate.exists() {
                                    println!("Found spotdl at: {:?}", candidate);
                                    return Some(candidate.to_string_lossy().to_string());
                                }
                            }
                        }
                    }

                    // Check user install location
                    if let Some(python_dir) = path.parent() {
                         #[cfg(target_os = "windows")]
                        let candidates = vec![
                            python_dir.join("Scripts").join("spotdl.exe"),
                            python_dir.join("Scripts").join("spotdl"),
                        ];
                        #[cfg(not(target_os = "windows"))]
                        let candidates = vec![
                            python_dir.join("bin").join("spotdl"),
                        ];

                        for candidate in &candidates {
                            println!("Checking candidate B: {:?}", candidate);
                            if candidate.exists() {
                                println!("Found spotdl at: {:?}", candidate);
                                return Some(candidate.to_string_lossy().to_string());
                            }
                        }
                    }
                }
            }
        } else {
#[tauri::command]
pub async fn check_spotdl_installed() -> Result<bool, String> {
    if let Some(_) = resolve_spotdl_path() {
        Ok(true)
    } else {
        // Fallback check
        let mut cmd = Command::new("spotdl");
        cmd.arg("--version");
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let output = cmd
            .output()
            .map_err(|e| e.to_string())?;
        Ok(output.status.success())
    }
}

#[tauri::command]
pub async fn install_spotdl() -> Result<String, String> {
    // Verify pip availability
    let mut cmd = Command::new("pip");
    cmd.arg("--version");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let pip_check = cmd
        .output()
        .map_err(|_| "Python/pip is not installed or not in PATH. Please install Python first.".to_string())?;

    if !pip_check.status.success() {
        return Err("Python/pip is not installed or not in PATH. Please install Python first.".to_string());
    }

    // Attempt installation via pip
    let mut cmd = Command::new("pip");
    cmd.arg("install").arg("spotdl");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute pip: {}", e))?;

    if output.status.success() {
        Ok("spotdl installed successfully".to_string())
    } else {
    // Attempt installation via pip
    let output = Command::new("pip")
        .arg("install")
        .arg("spotdl")
        .output()
        .map_err(|e| format!("Failed to execute pip: {}", e))?;

    if output.status.success() {
        Ok("spotdl installed successfully".to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to install spotdl: {}", stderr))
    }
}

#[tauri::command]
pub async fn open_downloads_folder(path: Option<String>) -> Result<(), String> {
    let folder_path = if let Some(p) = path {
        PathBuf::from(p)
    } else {
        let home = dirs::home_dir().ok_or("Could not find home directory")?;
        home.join("Downloads")
    };
    
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn download_track(
    window: Window,
    storage: State<'_, Mutex<Storage>>,
    url: String,
    format: String,
    quality: String,
    download_path: Option<String>
) -> Result<String, String> {
    let config = {
        let s = storage.lock().unwrap();
        s.load_config()
    };

    let download_dir = if let Some(p) = download_path {
        PathBuf::from(p)
    } else if let Some(p) = &config.download_path {
        PathBuf::from(p)
    } else {
        let home = dirs::home_dir().ok_or("Could not find home directory")?;
        home.join("Downloads")
    };
    
    let output_template = download_dir.join(&config.output_template);
    
    // Basic URL validation
    if !url.contains("spotify.com") && !url.contains("youtube.com") && !url.contains("youtu.be") {
        return Err("Invalid URL. Please provide a Spotify or YouTube link.".to_string());
    }

    let spotdl_cmd = resolve_spotdl_path().ok_or("spotdl not found. Please install it first.")?;

    let mut cmd = Command::new(spotdl_cmd);
    cmd.arg("download")
        .arg(&url)
        .arg("--format")
        .arg(&format)
        .arg("--bitrate")
        .arg(&quality)
        .arg("--output")
        .arg(format!("{}", output_template.display()));

    if config.use_sponsor_block {
        cmd.arg("--sponsor-block");
    }
    if config.generate_m3u {
        cmd.arg("--m3u");
    }
    if config.generate_lrc {
        cmd.arg("--generate-lrc");
    }
    if config.force_update_metadata {
        cmd.arg("--force-update-metadata");
    }
    
    // Configure concurrency
    cmd.arg("--threads").arg(config.threads.to_string());

    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let mut child = cmd
        .stdout(Stdio::piped())
        .stderr(Stdio::piped()) // Capture progress from stderr
        .spawn()
        .map_err(|e| format!("Failed to start spotdl: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let reader = BufReader::new(stdout);
    
    let window_clone = window.clone();
    
    for line in reader.lines() {
        match line {
            Ok(l) => {
                if let Some(_start) = l.find("%") {
                    let parts: Vec<&str> = l.split_whitespace().collect();
                    for part in parts {
                        if part.ends_with('%') {
                            if let Ok(p) = part.trim_end_matches('%').parse::<u32>() {
                                window_clone.emit("download-progress", ProgressPayload {
                                    percentage: p,
                                    message: l.clone(),
                                }).unwrap_or(());
                            }
                        }
                    }
                } else {
                     window_clone.emit("download-progress", ProgressPayload {
                        percentage: 0,
                        message: l.clone(),
                    }).unwrap_or(());
                }
            }
            Err(_) => break,
        }
    }

    let status = child.wait().map_err(|e| e.to_string())?;

    if status.success() {
        // Record successful download
        let item = HistoryItem {
            id: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis().to_string(),
            url: url.clone(),
            format: format.clone(),
            quality: quality.clone(),
            status: "completed".to_string(),
            timestamp: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64,
            title: None, // Metadata parsing pending
            artist: None,
        };
        
        let s = storage.lock().unwrap();
        let _ = s.add_history_item(item);

        Ok("Download completed successfully".to_string())
    } else {
        Err("Download failed".to_string())
    }
}

#[tauri::command]
pub async fn get_config(storage: State<'_, Mutex<Storage>>) -> Result<AppConfig, String> {
    let storage = storage.lock().unwrap();
    Ok(storage.load_config())
}

#[tauri::command]
pub async fn save_config(storage: State<'_, Mutex<Storage>>, config: AppConfig) -> Result<(), String> {
    let storage = storage.lock().unwrap();
    storage.save_config(&config)
}

#[tauri::command]
pub async fn get_history(storage: State<'_, Mutex<Storage>>) -> Result<Vec<HistoryItem>, String> {
    let storage = storage.lock().unwrap();
    Ok(storage.load_history())
}

#[tauri::command]
pub async fn clear_history(storage: State<'_, Mutex<Storage>>) -> Result<(), String> {
    let storage = storage.lock().unwrap();
    storage.save_history(&[])
}
