import * as SQLite from "expo-sqlite";

const DB_NAME = "fitness.db";
const SCHEMA_VERSION = 1;

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync("PRAGMA journal_mode = WAL;");
  await runMigrations(_db);
  return _db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_version LIMIT 1"
  );
  const current = row?.version ?? 0;

  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profile (
        user_id      TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        goal         TEXT,
        experience   TEXT,
        frequency    INTEGER,
        equipment_json TEXT,
        age          INTEGER,
        height       REAL,
        weight       REAL,
        cached_at    INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id               TEXT PRIMARY KEY,
        user_id          TEXT NOT NULL,
        title            TEXT,
        goal             TEXT,
        equipment_json   TEXT,
        level            TEXT,
        duration_minutes INTEGER,
        split_part       TEXT,
        workout_date     TEXT,
        cached_at        INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workout_exercises (
        id                 TEXT PRIMARY KEY,
        workout_id         TEXT NOT NULL,
        exercise_id        TEXT,
        name               TEXT NOT NULL,
        muscle_group       TEXT,
        required_equipment TEXT,
        difficulty_level   TEXT,
        sets               INTEGER,
        reps               INTEGER,
        rest               INTEGER,
        weight             REAL,
        cycle              INTEGER DEFAULT 0,
        position           INTEGER DEFAULT 0,
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS exercises (
        id                 TEXT PRIMARY KEY,
        name               TEXT NOT NULL,
        muscle_group       TEXT,
        required_equipment TEXT,
        difficulty_level   TEXT,
        description        TEXT,
        photo_path         TEXT,
        cached_at          INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workout_logs (
        id             TEXT PRIMARY KEY,
        user_id        TEXT NOT NULL,
        workout_id     TEXT NOT NULL,
        difficulty     INTEGER,
        sleep_hours    REAL,
        sleep_quality  INTEGER,
        stress_level   INTEGER,
        completed_at   INTEGER NOT NULL,
        synced         INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS exercise_logs (
        id              TEXT PRIMARY KEY,
        workout_log_id  TEXT NOT NULL,
        exercise_id     TEXT NOT NULL,
        rpe             REAL,
        form_quality    INTEGER,
        cycle           INTEGER,
        FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS set_logs (
        id               TEXT PRIMARY KEY,
        exercise_log_id  TEXT NOT NULL,
        reps             INTEGER,
        weight           REAL,
        rpe              REAL,
        FOREIGN KEY (exercise_log_id) REFERENCES exercise_logs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS progress_cache (
        user_id             TEXT PRIMARY KEY,
        workout_dates_json  TEXT,
        weight_history_json TEXT,
        cached_at           INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        operation       TEXT NOT NULL,
        payload_json    TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'pending',
        attempts        INTEGER NOT NULL DEFAULT 0,
        created_at      INTEGER NOT NULL,
        last_attempt_at INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_workouts_user        ON workouts(user_id);
      CREATE INDEX IF NOT EXISTS idx_workout_ex_workout   ON workout_exercises(workout_id);
      CREATE INDEX IF NOT EXISTS idx_workout_logs_user    ON workout_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_workout_logs_synced  ON workout_logs(synced);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status    ON sync_queue(status);
    `);

    if (current === 0) {
      await db.runAsync("INSERT INTO schema_version (version) VALUES (?)", [SCHEMA_VERSION]);
    } else {
      await db.runAsync("UPDATE schema_version SET version = ?", [SCHEMA_VERSION]);
    }
  }
}
