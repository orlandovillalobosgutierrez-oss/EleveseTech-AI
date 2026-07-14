import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('elevesetech.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY NOT NULL,
      technician_id TEXT NOT NULL,
      technician_name TEXT NOT NULL,
      elevator_id TEXT NOT NULL,
      building_name TEXT NOT NULL,
      address TEXT NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('preventive', 'corrective')),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ai_processing','ready_for_review','signed','syncing','synced','failed')),
      technician_notes TEXT DEFAULT '',
      formal_report TEXT,
      problem_description TEXT,
      solution_applied TEXT,
      ocr_text TEXT,
      signature TEXT,
      signature_geo_lat REAL,
      signature_geo_lng REAL,
      signature_timestamp TEXT,
      zone_classifications TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY NOT NULL,
      report_id TEXT NOT NULL,
      uri TEXT NOT NULL,
      blob_base64 TEXT,
      zone_category TEXT,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      file_size INTEGER NOT NULL,
      taken_at TEXT NOT NULL,
      upload_status TEXT NOT NULL DEFAULT 'pending' CHECK(upload_status IN ('pending','uploading','done','failed')),
      retry_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      report_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('upload_photos','webhook_report')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','done','failed')),
      payload TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL,
      last_attempt_at TEXT,
      error_message TEXT,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_photos_report ON photos(report_id);
    CREATE INDEX IF NOT EXISTS idx_photos_upload ON photos(upload_status);
    CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  `);
}

export async function resetDatabase(): Promise<void> {
  const database = getDatabase();
  await database.execAsync(`
    DROP TABLE IF EXISTS sync_queue;
    DROP TABLE IF EXISTS photos;
    DROP TABLE IF EXISTS reports;
    DROP TABLE IF EXISTS settings;
  `);
  await initDatabase();
}
