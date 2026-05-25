import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { annotate_code, annotate_view_code } = await request.json();

    const photos = await sql`
      SELECT * FROM photos WHERE annotate_code = ${annotate_code}
    `;
    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];

    if (photo.annotate_view_code) {
      if (photo.annotate_view_code !== annotate_view_code) {
        return NextResponse.json({ error: '标注密码错误' }, { status: 403 });
      }
    }

    const faces = await sql`
      SELECT * FROM faces WHERE photo_id = ${photo.id}
    `;
    return NextResponse.json({ ...photo, faces });
  } catch (error) {
    console.error('Get annotate photo error:', error);
    return NextResponse.json({ error: '获取照片失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const annotate_code = searchParams.get('annotate_code');

    if (!annotate_code) {
      return NextResponse.json({ error: '缺少照片代码' }, { status: 400 });
    }

    const photos = await sql`
      SELECT * FROM photos WHERE annotate_code = ${annotate_code}
    `;
    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];

    if (photo.annotate_view_code) {
      return NextResponse.json({ error: '需要验证码，请使用验证接口' }, { status: 403 });
    }

    const faces = await sql`
      SELECT * FROM faces WHERE photo_id = ${photo.id}
    `;
    return NextResponse.json({ ...photo, faces });
  } catch (error) {
    console.error('Get annotate photo error:', error);
    return NextResponse.json({ error: '获取照片失败' }, { status: 500 });
  }
}
