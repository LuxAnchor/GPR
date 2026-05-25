import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateUUID, generateSecureCode, generateAnnotateCode } from '@/lib/utils';
import { uploadFile } from '@/lib/storage';

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

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const photos = await sql`
      SELECT 
        p.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', f.id,
            'photo_id', f.photo_id,
            'x', f.x,
            'y', f.y,
            'width', f.width,
            'height', f.height,
            'name', f.name
          ) ORDER BY f.created_at)
          FROM faces f WHERE f.photo_id = p.id),
          '[]'
        ) as faces
      FROM photos p
      WHERE p.user_id = ${userId}
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json(photos);
  } catch (error) {
    console.error('Get photos error:', error);
    return NextResponse.json({ error: '获取照片列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ error: '请上传照片文件' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, pathname } = await uploadFile(buffer, file.name);

    const id = generateUUID();
    const code = generateSecureCode();
    const annotateCode = generateAnnotateCode();

    await sql`
      INSERT INTO photos (id, code, annotate_code, filename, originalname, filepath, user_id)
      VALUES (${id}, ${code}, ${annotateCode}, ${file.name}, ${file.name}, ${url}, ${userId})
    `;

    return NextResponse.json({ id, code });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : '上传失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
