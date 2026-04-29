const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'lmu.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    track TEXT NOT NULL,
    duration_hours REAL NOT NULL DEFAULT 12,
    fuel_per_lap REAL NOT NULL DEFAULT 0,
    energy_per_lap REAL NOT NULL DEFAULT 0,
    tyre_deg_fl REAL NOT NULL DEFAULT 0,
    tyre_deg_fr REAL NOT NULL DEFAULT 0,
    tyre_deg_rl REAL NOT NULL DEFAULT 0,
    tyre_deg_rr REAL NOT NULL DEFAULT 0,
    available_tyres INTEGER NOT NULL DEFAULT 32,
    estimated_total_laps INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    avg_lap_time_ms INTEGER NOT NULL DEFAULT 0,
    rotation_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    variant_name TEXT,
    start_time TEXT,
    fuel_per_lap REAL,
    energy_per_lap REAL,
    tyre_deg_fl REAL,
    tyre_deg_fr REAL,
    tyre_deg_rl REAL,
    tyre_deg_rr REAL,
    estimated_total_laps INTEGER,
    data TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS stints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    strategy_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    stint_number INTEGER NOT NULL,
    planned_start_lap INTEGER NOT NULL,
    planned_end_lap INTEGER NOT NULL,
    actual_end_lap INTEGER,
    confirmed INTEGER NOT NULL DEFAULT 0,
    fuel_load REAL,
    fuel_added REAL,
    energy_added REAL,
    tyres_changed INTEGER NOT NULL DEFAULT 4,
    damage_type TEXT NOT NULL DEFAULT 'none',
    actual_pit_time_sec REAL,
    estimated_start_time TEXT,
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS race_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    lap INTEGER,
    type TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
  );
`);

console.log('Database migrated successfully.');
db.close();
