import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { annotateCode, annotateViewCode } = await request.json();

    const photos = await sql`
      SELECT * FROM photos WHERE annotate_code = ${annotateCode}
    `;

    if (photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];

    if (photo.annotate_view_code && photo.annotate_view_code !== annotateViewCode) {
      return NextResponse.json({ error: '验证码错误' }, { status: 403 });
    }

    const faces = await sql`
      SELECT * FROM faces WHERE photo_id = ${photo.id} ORDER BY created_at
    `;

    return NextResponse.json({ ...photo, faces });
  } catch (error) {
    console.error('Verify annotate photo error:', error);
    return NextResponse.json({ error: '验证失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: '缺少标注码' }, { status: 400 });
    }

    const photos = await sql`
      SELECT * FROM photos WHERE annotate_code = ${code}
    `;

    if (photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];

    if (photo.annotate_view_code) {
      return NextResponse.json({ error: '需要验证码，请使用验证接口' }, { status: 403 });
    }

    const faces = await sql`
      SELECT * FROM faces WHERE photo_id = ${photo.id} ORDER BY created_at
    `;

    return NextResponse.json({ ...photo, faces });
  } catch (error) {
    console.error('Get annotate photo error:', error);
    return NextResponse.json({ error: '获取照片失败' }, { status: 500 });
  }
}
