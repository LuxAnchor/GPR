import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(file: Buffer, filename: string): Promise<{ url: string; pathname: string }> {
  const ext = filename.split('.').pop() || 'jpg';
  const key = `photos/${uuidv4()}.${ext}`;

  const options: Parameters<typeof put>[2] = {
    access: 'private',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    storeId: process.env.BLOB_STORE_ID,
  };

  const blob = await put(key, file, options);

  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}

export async function getFileUrl(pathname: string): Promise<string> {
  const { url } = await put(pathname, '', {
    access: 'private',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    storeId: process.env.BLOB_STORE_ID,
    addRandomSuffix: false,
  });
  return url;
}
