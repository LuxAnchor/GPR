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
  
  try {
    const photos = await sql`
      SELECT filepath, user_id, islocked FROM photos WHERE id = ${params.id}
    `;
    
    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];
    const userId = getUserId(request);
    
    let canAccess = false;
    
    if (userId && photo.user_id === userId) {
      canAccess = true;
    }
    
    if (photo.islocked === 1) {
      canAccess = true;
    }

    if (!canAccess) {
      return NextResponse.json({ error: '无权访问此照片' }, { status: 403 });
    }

    const response = await fetch(photo.filepath);
    if (!response.ok) {
      return NextResponse.json({ error: '无法获取照片' }, { status: 500 });
    }
    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Get image error:', error);
    return NextResponse.json({ error: '获取照片失败' }, { status: 500 });
  }
}
