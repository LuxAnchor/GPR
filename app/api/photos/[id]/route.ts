import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateUUID } from '@/lib/utils';
import { uploadFile } from '@/lib/storage';
import JSZip from 'jszip';

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

async function getPhotoById(id: string): Promise<any> {
  const photos = await sql`
    SELECT * FROM photos WHERE id = ${id}
  `;
  return photos[0] || null;
}

async function getPhotoWithFaces(id: string): Promise<any> {
  const photo = await getPhotoById(id);
  if (!photo) return null;

  const faces = await sql`
    SELECT * FROM faces WHERE photo_id = ${id}
  `;
  return { ...photo, faces };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const photo = await getPhotoWithFaces(params.id);
    if (!photo) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    if (photo.user_id !== userId) {
      return NextResponse.json({ error: '无权访问此照片' }, { status: 403 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Get photo error:', error);
    return NextResponse.json({ error: '获取照片失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const photo = await getPhotoById(params.id);
    if (!photo) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    if (photo.user_id !== userId) {
      return NextResponse.json({ error: '无权访问此照片' }, { status: 403 });
    }

    const { action, display_name, view_code, annotate_view_code, islocked } = await request.json();

    if (action === 'lock') {
      await sql`
        UPDATE photos SET islocked = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ${params.id}
      `;
      return NextResponse.json({ success: true });
    } else if (action === 'unlock') {
      await sql`
        UPDATE photos SET islocked = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ${params.id}
      `;
      return NextResponse.json({ success: true });
    } else if (islocked !== undefined) {
      await sql`
        UPDATE photos SET islocked = ${islocked}, updated_at = CURRENT_TIMESTAMP WHERE id = ${params.id}
      `;
      return NextResponse.json({ success: true });
    } else if (display_name !== undefined) {
      await sql`
        UPDATE photos SET display_name = ${display_name}, updated_at = CURRENT_TIMESTAMP WHERE id = ${params.id}
      `;
      return NextResponse.json({ success: true });
    } else if (view_code !== undefined) {
      await sql`
        UPDATE photos SET view_code = ${view_code || null}, updated_at = CURRENT_TIMESTAMP WHERE id = ${params.id}
      `;
      return NextResponse.json({ success: true });
    } else if (annotate_view_code !== undefined) {
      await sql`
        UPDATE photos SET annotate_view_code = ${annotate_view_code || null}, updated_at = CURRENT_TIMESTAMP WHERE id = ${params.id}
      `;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('Update photo error:', error);
    return NextResponse.json({ error: '更新照片失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const photo = await getPhotoById(params.id);
    if (!photo) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    if (photo.user_id !== userId) {
      return NextResponse.json({ error: '无权删除此照片' }, { status: 403 });
    }

    await sql`DELETE FROM faces WHERE photo_id = ${params.id}`;
    await sql`DELETE FROM photos WHERE id = ${params.id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json({ error: '删除照片失败' }, { status: 500 });
  }
}
