import { sql } from './db';

export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS photos (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(12) UNIQUE NOT NULL,
        annotate_code VARCHAR(12) UNIQUE NOT NULL,
        filename VARCHAR(255) NOT NULL,
        originalname VARCHAR(255) NOT NULL,
        filepath VARCHAR(500) NOT NULL,
        display_name VARCHAR(255),
        islocked INTEGER DEFAULT 0,
        user_id VARCHAR(36) NOT NULL,
        view_code VARCHAR(255),
        annotate_view_code VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS faces (
        id VARCHAR(36) PRIMARY KEY,
        photo_id VARCHAR(36) NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        width REAL NOT NULL,
        height REAL NOT NULL,
        name VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_photos_code ON photos(code)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_faces_photo_id ON faces(photo_id)
    `;

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}
