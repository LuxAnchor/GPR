import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  
  console.log('[Image API] Request started for photo:', params.id);
  
  try {
    const photos = await sql`
      SELECT filepath, user_id, islocked FROM photos WHERE id = ${params.id}
    `;
    
    console.log('[Image API] Photos query result:', photos);
    
    if (!photos || photos.length === 0) {
      console.log('[Image API] Photo not found');
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];
    const userId = getUserId(request);
    
    console.log('[Image API] Photo found:', {
      filepath: photo.filepath,
      islocked: photo.islocked,
      userId: photo.user_id,
      requestUserId: userId
    });
    
    let canAccess = false;
    
    if (userId && photo.user_id === userId) {
      canAccess = true;
      console.log('[Image API] Access granted: user owns this photo');
    }
    
    if (photo.islocked === 1) {
      canAccess = true;
      console.log('[Image API] Access granted: photo is locked');
    }

    if (!canAccess) {
      console.log('[Image API] Access denied');
      return NextResponse.json({ error: '无权访问此照片' }, { status: 403 });
    }

    console.log('[Image API] Fetching image from:', photo.filepath);
    const response = await fetch(photo.filepath);
    console.log('[Image API] Blob fetch response status:', response.status);
    
    if (!response.ok) {
      console.error('[Image API] Failed to fetch blob:', response.statusText);
      return NextResponse.json({ error: '无法获取照片' }, { status: 500 });
    }
    
    const blob = await response.blob();
    console.log('[Image API] Blob created, size:', blob.size);
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Image API] Error:', error);
    return NextResponse.json({ error: '获取照片失败' }, { status: 500 });
  }
}
