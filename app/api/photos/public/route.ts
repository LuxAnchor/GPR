import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code, view_code, name } = await request.json();

    const photos = await sql`
      SELECT * FROM photos WHERE code = ${code}
    `;
    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];

    if (photo.islocked !== 1) {
      return NextResponse.json({ error: '照片尚未解锁，无法访问' }, { status: 403 });
    }

    if (photo.view_code) {
      if (photo.view_code !== view_code) {
        return NextResponse.json({ error: '查看密码错误' }, { status: 403 });
      }

      if (!name) {
        return NextResponse.json({ error: '请输入姓名' }, { status: 400 });
      }

      const faces = await sql`
        SELECT * FROM faces WHERE photo_id = ${photo.id}
      `;
      const nameExists = faces.some((f: any) => f.name && f.name.trim() === name.trim());
      if (!nameExists) {
        return NextResponse.json({ error: '姓名不在名单中' }, { status: 403 });
      }
    }

    const faces = await sql`
      SELECT * FROM faces WHERE photo_id = ${photo.id}
    `;
    return NextResponse.json({ ...photo, faces });
  } catch (error) {
    console.error('Get public photo error:', error);
    return NextResponse.json({ error: '获取照片失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: '缺少照片代码' }, { status: 400 });
    }

    const photos = await sql`
      SELECT * FROM photos WHERE code = ${code}
    `;
    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];

    if (photo.islocked !== 1) {
      return NextResponse.json({ error: '照片尚未解锁，无法访问' }, { status: 403 });
    }

    if (photo.view_code) {
      return NextResponse.json({ error: '需要验证码，请使用验证接口' }, { status: 403 });
    }

    const faces = await sql`
      SELECT * FROM faces WHERE photo_id = ${photo.id}
    `;
    return NextResponse.json({ ...photo, faces });
  } catch (error) {
    console.error('Get public photo error:', error);
    return NextResponse.json({ error: '获取照片失败' }, { status: 500 });
  }
}
