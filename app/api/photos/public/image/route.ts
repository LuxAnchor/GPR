import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const annotate_code = searchParams.get('annotate_code');

  if (!code && !annotate_code) {
    return NextResponse.json({ error: '缺少照片代码' }, { status: 400 });
  }

  try {
    let query;
    if (code) {
      query = sql`SELECT filepath, islocked FROM photos WHERE code = ${code}`;
    } else {
      query = sql`SELECT filepath, islocked FROM photos WHERE annotate_code = ${annotate_code}`;
    }

    const photos = await query;
    
    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];

    // 如果是公开照片（已锁定），允许访问
    if (photo.islocked === 1) {
      const response = await fetch(photo.filepath);
      if (!response.ok) {
        return NextResponse.json({ error: '无法获取照片' }, { status: 500 });
      }
      const blob = await response.blob();
      return new NextResponse(blob, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    // 如果是标注链接，允许访问（不管是否锁定）
    if (annotate_code) {
      const response = await fetch(photo.filepath);
      if (!response.ok) {
        return NextResponse.json({ error: '无法获取照片' }, { status: 500 });
      }
      const blob = await response.blob();
      return new NextResponse(blob, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    return NextResponse.json({ error: '照片尚未解锁，无法访问' }, { status: 403 });
  } catch (error) {
    console.error('Get public image error:', error);
    return NextResponse.json({ error: '获取照片失败' }, { status: 500 });
  }
}
