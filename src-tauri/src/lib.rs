use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, Manager};

/// `<app config dir>/backups`, the folder next to `deutschlab.db`. Created on
/// demand; nothing in it is ever overwritten or deleted by the app.
fn backup_folder(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("No app data folder: {error}"))?
        .join("backups");

    fs::create_dir_all(&dir).map_err(|error| format!("Could not create {}: {error}", dir.display()))?;

    Ok(dir)
}

/// A plain file name such as `deutschlab-backup-2026-10-13-1830.json`:
/// letters, digits, `-`, `_` and `.` only, so it cannot leave the folder.
fn is_safe_file_name(name: &str, extension: &str) -> bool {
    !name.is_empty()
        && name.len() <= 120
        && !name.starts_with('.')
        && name.ends_with(extension)
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.')
}

/// Path where a database snapshot (`VACUUM INTO`) may be written. Fails if a
/// file with that name already exists, so a snapshot never replaces another.
#[tauri::command]
fn backup_path(app: AppHandle, file_name: String) -> Result<String, String> {
    if !is_safe_file_name(&file_name, ".db") {
        return Err("Invalid backup file name.".into());
    }

    let path = backup_folder(&app)?.join(&file_name);

    if path.exists() {
        return Err(format!("{} already exists.", path.display()));
    }

    Ok(path.to_string_lossy().into_owned())
}

/// Writes an exported JSON backup into the backups folder and returns its
/// full path. Never overwrites an existing file.
#[tauri::command]
fn write_backup_file(app: AppHandle, file_name: String, contents: String) -> Result<String, String> {
    if !is_safe_file_name(&file_name, ".json") {
        return Err("Invalid backup file name.".into());
    }

    let path = backup_folder(&app)?.join(&file_name);

    fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)
        .and_then(|mut file| std::io::Write::write_all(&mut file, contents.as_bytes()))
        .map_err(|error| format!("Could not write {}: {error}", path.display()))?;

    Ok(path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![backup_path, write_backup_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::is_safe_file_name;

    #[test]
    fn accepts_plain_backup_names() {
        assert!(is_safe_file_name("deutschlab-backup-2026-10-13-1830.json", ".json"));
        assert!(is_safe_file_name("deutschlab-2026-10-13-1830.db", ".db"));
    }

    #[test]
    fn rejects_paths_and_wrong_extensions() {
        assert!(!is_safe_file_name("../deutschlab.db", ".db"));
        assert!(!is_safe_file_name("backups/x.json", ".json"));
        assert!(!is_safe_file_name("x.json", ".db"));
        assert!(!is_safe_file_name(".json", ".json"));
        assert!(!is_safe_file_name("", ".json"));
        assert!(!is_safe_file_name("a b.json", ".json"));
    }
}
