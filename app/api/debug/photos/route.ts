import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded?.userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const photos = await sql`
      SELECT id, originalname, filepath, islocked, user_id FROM photos WHERE user_id = ${decoded.userId}
    `;

    return NextResponse.json({
      userId: decoded.userId,
      photos: photos.map(p => ({
        id: p.id,
        originalname: p.originalname,
        filepath: p.filepath,
        islocked: p.islocked,
        user_id: p.user_id,
        filepathIsUrl: p.filepath.startsWith('http'),
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Failed to get photos' }, { status: 500 });
  }
}
