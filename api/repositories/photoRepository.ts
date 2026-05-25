import { db } from '../models/database.js';
import { v4 as uuidv4 } from 'uuid';
import { generateSecureCode, generateAnnotateCode } from '../utils/codeGenerator.js';
import type { Photo, PhotoWithFaces, Face } from '../../shared/types.js';

export class PhotoRepository {
  create(filename: string, originalname: string, filepath: string, userId: string): Photo {
    const id = uuidv4();
    const code = generateSecureCode();
    const annotateCode = generateAnnotateCode();
    
    db.prepare(`
      INSERT INTO photos (id, code, annotate_code, filename, originalname, filepath, islocked, user_id)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, code, annotateCode, filename, originalname, filepath, userId);
    
    return this.findById(id)!;
  }

  findById(id: string): Photo | null {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id) as Photo | undefined;
    return photo || null;
  }

  findByCode(code: string): Photo | null {
    const photo = db.prepare('SELECT * FROM photos WHERE code = ?').get(code) as Photo | undefined;
    return photo || null;
  }

  findByAnnotateCode(annotateCode: string): Photo | null {
    const photo = db.prepare('SELECT * FROM photos WHERE annotate_code = ?').get(annotateCode) as Photo | undefined;
    return photo || null;
  }

  findAll(): Photo[] {
    return db.prepare('SELECT * FROM photos ORDER BY created_at DESC').all() as Photo[];
  }

  findByUserId(userId: string): Photo[] {
    return db.prepare('SELECT * FROM photos WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Photo[];
  }

  findAllWithFaces(): PhotoWithFaces[] {
    const photos = this.findAll();
    return photos.map(photo => {
      const faces = db.prepare('SELECT * FROM faces WHERE photo_id = ?').all(photo.id) as Face[];
      return { ...photo, faces };
    });
  }

  findByUserIdWithFaces(userId: string): PhotoWithFaces[] {
    const photos = this.findByUserId(userId);
    return photos.map(photo => {
      const faces = db.prepare('SELECT * FROM faces WHERE photo_id = ?').all(photo.id) as Face[];
      return { ...photo, faces };
    });
  }

  lock(id: string): boolean {
    const result = db.prepare('UPDATE photos SET islocked = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    return result.changes > 0;
  }

  unlock(id: string): boolean {
    const result = db.prepare('UPDATE photos SET islocked = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    return result.changes > 0;
  }

  updateDisplayName(id: string, displayName: string): boolean {
    const result = db.prepare('UPDATE photos SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(displayName, id);
    return result.changes > 0;
  }

  regenerateAnnotateCode(id: string): string | null {
    const newAnnotateCode = generateAnnotateCode();
    const result = db.prepare('UPDATE photos SET annotate_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newAnnotateCode, id);
    return result.changes > 0 ? newAnnotateCode : null;
  }

  // 设置查看验证码
  setViewCode(id: string, viewCode: string | null): boolean {
    const result = db.prepare('UPDATE photos SET view_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(viewCode, id);
    return result.changes > 0;
  }

  // 设置标注验证码
  setAnnotateViewCode(id: string, annotateViewCode: string | null): boolean {
    const result = db.prepare('UPDATE photos SET annotate_view_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(annotateViewCode, id);
    return result.changes > 0;
  }

  // 验证查看验证码
  verifyViewCode(code: string, viewCode: string): Photo | null {
    const photo = this.findByCode(code);
    if (!photo) return null;
    // 如果没有设置验证码，直接通过
    if (!photo.view_code) return photo;
    // 验证验证码
    if (photo.view_code === viewCode) return photo;
    return null;
  }

  // 验证标注验证码
  verifyAnnotateViewCode(annotateCode: string, annotateViewCode: string): Photo | null {
    const photo = this.findByAnnotateCode(annotateCode);
    if (!photo) return null;
    // 如果没有设置验证码，直接通过
    if (!photo.annotate_view_code) return photo;
    // 验证验证码
    if (photo.annotate_view_code === annotateViewCode) return photo;
    return null;
  }

  async delete(id: string): Promise<boolean> {
    const photo = this.findById(id);
    if (!photo) return false;
    
    db.prepare('DELETE FROM faces WHERE photo_id = ?').run(id);
    const result = db.prepare('DELETE FROM photos WHERE id = ?').run(id);
    
    try {
      const fs = await import('fs');
      if (fs.existsSync(photo.filepath)) {
        fs.unlinkSync(photo.filepath);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
    
    return result.changes > 0;
  }
}

export class FaceRepository {
  create(photoId: string, x: number, y: number, width: number, height: number, name: string = ''): Face {
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO faces (id, photo_id, x, y, width, height, name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, photoId, x, y, width, height, name);
    
    return this.findById(id)!;
  }

  findById(id: string): Face | null {
    const face = db.prepare('SELECT * FROM faces WHERE id = ?').get(id) as Face | undefined;
    return face || null;
  }

  findByPhotoId(photoId: string): Face[] {
    return db.prepare('SELECT * FROM faces WHERE photo_id = ?').all(photoId) as Face[];
  }

  update(id: string, x: number, y: number, width: number, height: number, name: string): boolean {
    const result = db.prepare(`
      UPDATE faces SET x = ?, y = ?, width = ?, height = ?, name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(x, y, width, height, name, id);
    return result.changes > 0;
  }

  updateName(id: string, name: string): boolean {
    const result = db.prepare('UPDATE faces SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, id);
    return result.changes > 0;
  }

  delete(id: string): boolean {
    const result = db.prepare('DELETE FROM faces WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export const photoRepository = new PhotoRepository();
export const faceRepository = new FaceRepository();
