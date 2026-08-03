import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'laundry.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lastName TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'resident'
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      machineId INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'wash' or 'wash_and_dry'
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'exchange_offered'
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machineId INTEGER, -- null means all machines
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      reason TEXT
    );
  `);

  // Seed default admin if no users exist
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as {count: number};
  if (count.count === 0) {
    const adminHash = bcrypt.hashSync('admin', 10);
    db.prepare('INSERT INTO users (lastName, passwordHash, role) VALUES (?, ?, ?)').run('admin', adminHash, 'admin');
    
    // Seed some test users
    const userHash = bcrypt.hashSync('test', 10);
    db.prepare('INSERT INTO users (lastName, passwordHash, role) VALUES (?, ?, ?)').run('Müller', userHash, 'resident');
    db.prepare('INSERT INTO users (lastName, passwordHash, role) VALUES (?, ?, ?)').run('Schmidt', userHash, 'resident');
  }
}

export default db;
