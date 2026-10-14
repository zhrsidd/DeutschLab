mod ai;

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
        .and_then(|mut file| {
            std::io::Write::write_all(&mut file, contents.as_bytes())?;
            // Make sure the backup has reached the disk before we say "Saved".
            file.sync_all()
        })
        .map_err(|error| format!("Could not write {}: {error}", path.display()))?;

    Ok(path.to_string_lossy().into_owned())
}

/// Checks that a snapshot file is a complete SQLite database header-wise and
/// forces it to disk. SQLite does not fsync the file that `VACUUM INTO`
/// writes, so without this a crash right after "Saved" could lose it.
fn seal_snapshot(path: &std::path::Path) -> Result<u64, String> {
    let mut file = fs::File::open(path).map_err(|error| format!("Could not open {}: {error}", path.display()))?;

    let mut header = [0u8; 16];
    std::io::Read::read_exact(&mut file, &mut header)
        .map_err(|error| format!("{} is too short: {error}", path.display()))?;
    if &header != b"SQLite format 3\0" {
        return Err(format!("{} is not an SQLite database.", path.display()));
    }

    file.sync_all().map_err(|error| format!("Could not sync {}: {error}", path.display()))?;
    let size = file.metadata().map_err(|error| error.to_string())?.len();

    // The page size is stored at offset 16; the file must hold whole pages.
    let mut page = [0u8; 2];
    let _ = std::io::Seek::seek(&mut file, std::io::SeekFrom::Start(16));
    std::io::Read::read_exact(&mut file, &mut page).map_err(|error| error.to_string())?;
    let page_size = match u16::from_be_bytes(page) {
        1 => 65_536,
        value => u64::from(value),
    };
    if page_size < 512 || size % page_size != 0 {
        return Err(format!("{} is incomplete.", path.display()));
    }

    Ok(size)
}

/// Called after `VACUUM INTO`: verifies and fsyncs the snapshot.
#[tauri::command]
fn seal_backup_file(app: AppHandle, file_name: String) -> Result<u64, String> {
    if !is_safe_file_name(&file_name, ".db") {
        return Err("Invalid backup file name.".into());
    }

    seal_snapshot(&backup_folder(&app)?.join(&file_name))
}

/*
 * Native self-test (release verification only). Inert unless the app is
 * started with DEUTSCHLAB_SELFTEST_OUT=/path/report.json. The frontend then
 * uses deutschlab-selftest.db, never deutschlab.db, writes a report and quits.
 */

const SELFTEST_DB: &str = "deutschlab-selftest.db";

fn selftest_out() -> Option<String> {
    std::env::var("DEUTSCHLAB_SELFTEST_OUT")
        .ok()
        .filter(|path| path.ends_with(".json") && !path.is_empty())
}

/// The report path when the self-test was requested, otherwise None.
#[tauri::command]
fn selftest_report_path() -> Option<String> {
    selftest_out()
}

/// Size of the self-test database's WAL file (to prove commits are pending).
#[tauri::command]
fn selftest_wal_bytes(app: AppHandle) -> Result<u64, String> {
    selftest_out().ok_or("Self-test is not enabled.")?;
    let dir = app.path().app_config_dir().map_err(|error| error.to_string())?;
    Ok(fs::metadata(dir.join(format!("{SELFTEST_DB}-wal"))).map(|meta| meta.len()).unwrap_or(0))
}

/// Writes the report and quits the app.
#[tauri::command]
fn finish_selftest(app: AppHandle, report: String) -> Result<(), String> {
    let out = selftest_out().ok_or("Self-test is not enabled.")?;
    fs::write(&out, report).map_err(|error| format!("Could not write {out}: {error}"))?;
    app.exit(0);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            backup_path,
            write_backup_file,
            seal_backup_file,
            selftest_report_path,
            selftest_wal_bytes,
            finish_selftest,
            ai::ai_key_status,
            ai::ai_save_key,
            ai::ai_remove_key,
            ai::ai_test_connection,
            ai::ai_generate,
            ai::ai_transcribe
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{is_safe_file_name, seal_snapshot};

    fn scratch(name: &str, bytes: &[u8]) -> std::path::PathBuf {
        let path = std::env::temp_dir().join(format!("deutschlab-seal-{}-{name}", std::process::id()));
        std::fs::write(&path, bytes).unwrap();
        path
    }

    #[test]
    fn seals_a_whole_sqlite_file() {
        let mut bytes = vec![0u8; 4096 * 2];
        bytes[..16].copy_from_slice(b"SQLite format 3\0");
        bytes[16..18].copy_from_slice(&4096u16.to_be_bytes());
        let path = scratch("ok.db", &bytes);
        assert_eq!(seal_snapshot(&path), Ok(8192));
        std::fs::remove_file(path).unwrap();
    }

    #[test]
    fn rejects_truncated_or_foreign_files() {
        let mut bytes = vec![0u8; 4096 + 100];
        bytes[..16].copy_from_slice(b"SQLite format 3\0");
        bytes[16..18].copy_from_slice(&4096u16.to_be_bytes());
        let truncated = scratch("short.db", &bytes);
        assert!(seal_snapshot(&truncated).is_err());
        std::fs::remove_file(truncated).unwrap();

        let foreign = scratch("text.db", b"this is not a database at all...");
        assert!(seal_snapshot(&foreign).is_err());
        std::fs::remove_file(foreign).unwrap();
    }

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
