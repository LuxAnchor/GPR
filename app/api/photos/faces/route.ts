import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateUUID } from '@/lib/utils';

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

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { photo_id, x, y, width, height, name } = await request.json();

    if (!photo_id || x === undefined || y === undefined || width === undefined || height === undefined) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const photos = await sql`
      SELECT * FROM photos WHERE id = ${photo_id} AND user_id = ${userId}
    `;
    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: '照片不存在或无权访问' }, { status: 404 });
    }

    const id = generateUUID();
    await sql`
      INSERT INTO faces (id, photo_id, x, y, width, height, name)
      VALUES (${id}, ${photo_id}, ${Number(x)}, ${Number(y)}, ${Number(width)}, ${Number(height)}, ${name || ''})
    `;

    const newFaces = await sql`
      SELECT * FROM faces WHERE id = ${id}
    `;
    return NextResponse.json(newFaces[0]);
  } catch (error) {
    console.error('Create face error:', error);
    return NextResponse.json({ error: '创建人脸标注失败' }, { status: 500 });
  }
}
