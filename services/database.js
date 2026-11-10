import * as SQLite from 'expo-sqlite';

let db;

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('locations.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp TEXT NOT NULL
      );
    `);
  }
  return db;
}

export async function insertLocation(latitude, longitude, timestamp) {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO locations (latitude, longitude, timestamp) VALUES (?, ?, ?);',
    [latitude, longitude, timestamp]
  );
  return result.lastInsertRowId;
}

export async function fetchLocations() {
  const database = await getDatabase();
  const rows = await database.getAllAsync(
    'SELECT * FROM locations ORDER BY id DESC;'
  );
  return rows;
}