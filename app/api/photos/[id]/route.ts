import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateAnnotateCode } from '@/lib/utils';

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const photos = await sql`
      SELECT * FROM photos WHERE id = ${id} AND user_id = ${userId}
    `;

    if (photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];
    const faces = await sql`
      SELECT * FROM faces WHERE photo_id = ${id} ORDER BY created_at
    `;

    return NextResponse.json({ ...photo, faces });
  } catch (error) {
    console.error('Get photo error:', error);
    return NextResponse.json({ error: '获取照片失败' }, { status: 500 });
  }
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
    const body = await request.json();
    const { action, displayName, viewCode, annotateViewCode } = body;

    const photos = await sql`
      SELECT * FROM photos WHERE id = ${id} AND user_id = ${userId}
    `;

    if (photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    switch (action) {
      case 'lock':
        await sql`UPDATE photos SET islocked = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
        return NextResponse.json({ success: true });

      case 'unlock':
        await sql`UPDATE photos SET islocked = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
        return NextResponse.json({ success: true });

      case 'display-name':
        await sql`UPDATE photos SET display_name = ${displayName}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
        return NextResponse.json({ success: true });

      case 'view-code':
        await sql`UPDATE photos SET view_code = ${viewCode || null}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
        return NextResponse.json({ success: true });

      case 'annotate-view-code':
        await sql`UPDATE photos SET annotate_view_code = ${annotateViewCode || null}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
        return NextResponse.json({ success: true });

      case 'regenerate-annotate-code':
        const newAnnotateCode = generateAnnotateCode();
        await sql`UPDATE photos SET annotate_code = ${newAnnotateCode}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
        return NextResponse.json({ success: true, annotateCode: newAnnotateCode });

      default:
        return NextResponse.json({ error: '无效的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Update photo error:', error);
    return NextResponse.json({ error: '更新照片失败' }, { status: 500 });
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
    const photos = await sql`
      SELECT * FROM photos WHERE id = ${id} AND user_id = ${userId}
    `;

    if (photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    await sql`DELETE FROM faces WHERE photo_id = ${id}`;
    await sql`DELETE FROM photos WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json({ error: '删除照片失败' }, { status: 500 });
  }
}
