import { db } from '../models/database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

export interface SafeUser {
  id: string;
  username: string;
  created_at: string;
}

class UserRepository {
  create(username: string, password: string): SafeUser | null {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      db.prepare(
        'INSERT INTO users (id, username, password) VALUES (?, ?, ?)'
      ).run(id, username, hashedPassword);
      return this.findById(id)!;
    } catch (e) {
      console.error('Create user error:', e);
      return null;
    }
  }

  findById(id: string): SafeUser | null {
    const row = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(id);
    return row as SafeUser || null;
  }

  findByUsername(username: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    return row as User || null;
  }

  verifyPassword(plainPassword: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  findAll(): SafeUser[] {
    const rows = db.prepare('SELECT id, username, created_at FROM users').all();
    return rows as SafeUser[];
  }
}

export const userRepository = new UserRepository();
