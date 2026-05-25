import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { code, viewCode, name } = await request.json();

    const photos = await sql`
      SELECT * FROM photos WHERE code = ${code}
    `;

    if (photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];

    if (!photo.islocked) {
      return NextResponse.json({ error: '照片尚未解锁，无法访问' }, { status: 403 });
    }

    if (photo.view_code && photo.view_code !== viewCode) {
      return NextResponse.json({ error: '验证码错误' }, { status: 403 });
    }

    const faces = await sql`
      SELECT * FROM faces WHERE photo_id = ${photo.id} ORDER BY created_at
    `;

    if (photo.view_code && photo.view_code !== '') {
      if (!name) {
        return NextResponse.json({ error: '请输入姓名' }, { status: 400 });
      }

      const nameExists = faces.some((face: any) => face.name && face.name.trim() === name.trim());
      if (!nameExists) {
        return NextResponse.json({ error: '姓名不在名单中' }, { status: 403 });
      }
    }

    return NextResponse.json({ ...photo, faces });
  } catch (error) {
    console.error('Verify public photo error:', error);
    return NextResponse.json({ error: '验证失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: '缺少访问码' }, { status: 400 });
    }

    const photos = await sql`
      SELECT * FROM photos WHERE code = ${code}
    `;

    if (photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];

    if (!photo.islocked) {
      return NextResponse.json({ error: '照片尚未解锁，无法访问' }, { status: 403 });
    }

    if (photo.view_code) {
      return NextResponse.json({ error: '需要验证码，请使用验证接口' }, { status: 403 });
    }

    const faces = await sql`
      SELECT * FROM faces WHERE photo_id = ${photo.id} ORDER BY created_at
    `;

    return NextResponse.json({ ...photo, faces });
  } catch (error) {
    console.error('Get public photo error:', error);
    return NextResponse.json({ error: '获取照片失败' }, { status: 500 });
  }
}
