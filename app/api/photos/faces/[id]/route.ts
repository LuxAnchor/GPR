import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const { x, y, width, height, name } = await request.json();

    const faces = await sql`
      SELECT f.* FROM faces f
      JOIN photos p ON f.photo_id = p.id
      WHERE f.id = ${id} AND p.user_id = ${userId}
    `;

    if (faces.length === 0) {
      return NextResponse.json({ error: '人脸标注不存在' }, { status: 404 });
    }

    await sql`
      UPDATE faces 
      SET x = ${x}, y = ${y}, width = ${width}, height = ${height}, name = ${name || ''}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update face error:', error);
    return NextResponse.json({ error: '更新人脸标注失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;

    const faces = await sql`
      SELECT f.* FROM faces f
      JOIN photos p ON f.photo_id = p.id
      WHERE f.id = ${id} AND p.user_id = ${userId}
    `;

    if (faces.length === 0) {
      return NextResponse.json({ error: '人脸标注不存在' }, { status: 404 });
    }

    await sql`DELETE FROM faces WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete face error:', error);
    return NextResponse.json({ error: '删除人脸标注失败' }, { status: 500 });
  }
}
