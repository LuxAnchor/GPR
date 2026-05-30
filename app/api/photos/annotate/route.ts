import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { annotate_code, annotate_view_code, faces, action } = await request.json();

    const photos = await sql`
      SELECT * FROM photos WHERE annotate_code = ${annotate_code}
    `;
    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }

    const photo = photos[0];

    if (photo.islocked === 1) {
      return NextResponse.json({ error: '照片已锁定，标注链接不可访问' }, { status: 403 });
    }

    if (photo.annotate_view_code) {
      if (photo.annotate_view_code !== annotate_view_code) {
        return NextResponse.json({ error: '标注密码错误' }, { status: 403 });
      }
    }

    if (action === 'save' && faces) {
      for (const face of faces) {
        if (face.id) {
          await sql`
            UPDATE faces 
            SET x = ${face.x}, y = ${face.y}, width = ${face.width}, height = ${face.height}, name = ${face.name}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${face.id}
          `;
        } else {
          await sql`
            INSERT INTO faces (photo_id, x, y, width, height, name, created_at, updated_at)
            VALUES (${photo.id}, ${face.x}, ${face.y}, ${face.width}, ${face.height}, ${face.name}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `;
        }
      }

      await sql`
        UPDATE photos SET updated_at = CURRENT_TIMESTAMP WHERE id = ${photo.id}
      `;
    }

    const updatedFaces = await sql`
      SELECT * FROM faces WHERE photo_id = ${photo.id}
    `;
    return NextResponse.json({ ...photo, faces: updatedFaces });
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

    if (photo.islocked === 1) {
      return NextResponse.json({ error: '照片已锁定，标注链接不可访问' }, { status: 403 });
    }

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
