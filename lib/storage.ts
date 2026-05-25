import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(file: Buffer, filename: string): Promise<{ url: string; pathname: string }> {
  const ext = filename.split('.').pop() || 'jpg';
  const key = `photos/${uuidv4()}.${ext}`;

  const blob = await put(key, file, {
    access: 'public',
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}
