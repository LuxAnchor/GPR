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

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { x, y, width, height, name } = await request.json();

    const faces = await sql`
      SELECT f.* FROM faces f JOIN photos p ON f.photo_id = p.id WHERE f.id = ${params.id} AND p.user_id = ${userId}
    `;
    if (!faces || faces.length === 0) {
      return NextResponse.json({ error: '人脸标注不存在' }, { status: 404 });
    }

    await sql`
      UPDATE faces SET
        x = ${Number(x)},
        y = ${Number(y)},
        width = ${Number(width)},
        height = ${Number(height)},
        name = ${name || ''},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update face error:', error);
    return NextResponse.json({ error: '更新人脸标注失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const faces = await sql`
      SELECT f.* FROM faces f JOIN photos p ON f.photo_id = p.id WHERE f.id = ${params.id} AND p.user_id = ${userId}
    `;
    if (!faces || faces.length === 0) {
      return NextResponse.json({ error: '人脸标注不存在' }, { status: 404 });
    }

    await sql`DELETE FROM faces WHERE id = ${params.id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete face error:', error);
    return NextResponse.json({ error: '删除人脸标注失败' }, { status: 500 });
  }
}
