import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateUUID } from '@/lib/utils';

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { photoId, x, y, width, height, name } = await request.json();

    if (!photoId || x === undefined || y === undefined || width === undefined || height === undefined) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const photos = await sql`
      SELECT * FROM photos WHERE id = ${photoId} AND user_id = ${userId}
    `;

    if (photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const id = generateUUID();
    await sql`
      INSERT INTO faces (id, photo_id, x, y, width, height, name)
      VALUES (${id}, ${photoId}, ${x}, ${y}, ${width}, ${height}, ${name || ''})
    `;

    return NextResponse.json({ id, photoId, x, y, width, height, name: name || '' });
  } catch (error) {
    console.error('Create face error:', error);
    return NextResponse.json({ error: '创建人脸标注失败' }, { status: 500 });
  }
}
