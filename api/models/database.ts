import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'photos.db');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

// 检查表是否存在
const tableExists = (tableName: string): boolean => {
  const result = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(tableName);
  return !!result;
};

// 添加列（如果不存在）
const addColumnIfNotExists = (tableName: string, columnName: string, columnDef: string) => {
  try {
    // 先检查列是否已存在
    const pragmaResult = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
    const columnExists = pragmaResult.some(col => col.name === columnName);
    
    if (!columnExists) {
      db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`).run();
      console.log(`Added column ${columnName} to ${tableName}`);
    }
  } catch (e) {
    // 忽略列已存在的错误
    console.log(`Column ${columnName} may already exist in ${tableName}`);
  }
};

// 创建用户表
if (!tableExists('users')) {
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// 创建照片表
if (!tableExists('photos')) {
  db.exec(`
    CREATE TABLE photos (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      annotate_code TEXT UNIQUE,
      display_name TEXT,
      filename TEXT NOT NULL,
      originalname TEXT NOT NULL,
      filepath TEXT NOT NULL,
      islocked INTEGER DEFAULT 0,
      user_id TEXT NOT NULL,
      view_code TEXT,
      annotate_view_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
} else {
  // 为现有表添加新列
  addColumnIfNotExists('photos', 'annotate_code', 'TEXT UNIQUE');
  addColumnIfNotExists('photos', 'display_name', 'TEXT');
  addColumnIfNotExists('photos', 'user_id', 'TEXT');
  addColumnIfNotExists('photos', 'view_code', 'TEXT');
  addColumnIfNotExists('photos', 'annotate_view_code', 'TEXT');
}

// 创建人脸表
if (!tableExists('faces')) {
  db.exec(`
    CREATE TABLE faces (
      id TEXT PRIMARY KEY,
      photo_id TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    );
  `);
}

// 创建索引
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_photos_code ON photos(code);
  CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
  CREATE INDEX IF NOT EXISTS idx_faces_photo_id ON faces(photo_id);
  CREATE INDEX IF NOT EXISTS idx_photos_annotate_code ON photos(annotate_code);
`);
