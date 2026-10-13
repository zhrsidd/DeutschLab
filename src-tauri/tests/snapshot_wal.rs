//! A database snapshot taken while deutschlab.db is in WAL mode with commits
//! that have not been checkpointed, through sqlx and its bundled SQLite: the
//! same stack tauri-plugin-sql runs inside the app. Uses throwaway files only.

use std::path::PathBuf;
use std::str::FromStr;

use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};
use sqlx::{Row, SqlitePool};

fn scratch_dir(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("deutschlab-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

async fn pool(path: &PathBuf, max: u32) -> SqlitePool {
    let options = SqliteConnectOptions::from_str(&format!("sqlite:{}", path.display()))
        .unwrap()
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        // Keep commits in the WAL file, as during a long app session.
        .pragma("wal_autocheckpoint", "0");
    SqlitePoolOptions::new().max_connections(max).connect_with(options).await.unwrap()
}

async fn count(pool: &SqlitePool, sql: &str) -> i64 {
    sqlx::query(sql).fetch_one(pool).await.unwrap().get::<i64, _>(0)
}

async fn dump(pool: &SqlitePool) -> Vec<String> {
    sqlx::query("SELECT source_id || '|' || prompt || '|' || interval_days FROM review_items ORDER BY id")
        .fetch_all(pool)
        .await
        .unwrap()
        .into_iter()
        .map(|row| row.get::<String, _>(0))
        .collect()
}

#[test]
fn vacuum_into_captures_uncheckpointed_wal_commits() {
    let runtime = tokio::runtime::Builder::new_current_thread().enable_all().build().unwrap();

    runtime.block_on(async {
        let dir = scratch_dir("snapshot-wal");
        let live = dir.join("deutschlab.db");
        let app = pool(&live, 4).await;

        sqlx::query(
            "CREATE TABLE review_items (id INTEGER PRIMARY KEY AUTOINCREMENT, source_id TEXT NOT NULL, \
             prompt TEXT NOT NULL, interval_days INTEGER NOT NULL DEFAULT 1)",
        )
        .execute(&app)
        .await
        .unwrap();
        for i in 0..500 {
            sqlx::query("INSERT INTO review_items (source_id, prompt) VALUES (?, ?)")
                .bind(format!("pr-c-mich-{i}"))
                .bind(format!("Der Lehrer fragt ___. ({i})"))
                .execute(&app)
                .await
                .unwrap();
        }

        let mode: String = sqlx::query("PRAGMA journal_mode").fetch_one(&app).await.unwrap().get(0);
        assert_eq!(mode, "wal");
        let wal = std::fs::metadata(dir.join("deutschlab.db-wal")).unwrap().len();
        assert!(wal > 50_000, "expected uncheckpointed commits in the WAL, got {wal} bytes");

        // A plain copy of the main file misses the WAL commits.
        let naive = dir.join("naive.db");
        std::fs::copy(&live, &naive).unwrap();
        let copy = pool(&naive, 1).await;
        let copied = sqlx::query("SELECT COUNT(*) FROM review_items").fetch_one(&copy).await;
        assert!(copied.map(|row| row.get::<i64, _>(0)).unwrap_or(0) < 500);
        copy.close().await;

        // What the app does: VACUUM INTO with a bound path, on any pool connection.
        let snapshot = dir.join("deutschlab-snapshot.db");
        sqlx::query("VACUUM INTO ?")
            .bind(snapshot.to_string_lossy().into_owned())
            .execute(&app)
            .await
            .unwrap();

        // The live WAL was not checkpointed by the snapshot.
        assert!(std::fs::metadata(dir.join("deutschlab.db-wal")).unwrap().len() >= wal);

        let restored = pool(&snapshot, 1).await;
        let check: String = sqlx::query("PRAGMA integrity_check").fetch_one(&restored).await.unwrap().get(0);
        assert_eq!(check, "ok");
        assert_eq!(count(&restored, "SELECT COUNT(*) FROM review_items").await, 500);
        assert_eq!(dump(&restored).await, dump(&app).await, "records differ");

        // A snapshot never replaces another file.
        let again = sqlx::query("VACUUM INTO ?")
            .bind(snapshot.to_string_lossy().into_owned())
            .execute(&app)
            .await;
        assert!(again.is_err(), "VACUUM INTO overwrote an existing snapshot");

        restored.close().await;
        app.close().await;
        std::fs::remove_dir_all(dir).unwrap();
    });
}
