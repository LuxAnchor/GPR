import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { generateUUID } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    const existingUser = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const userId = generateUUID();

    await sql`
      INSERT INTO users (id, username, password)
      VALUES (${userId}, ${username}, ${hashedPassword})
    `;

    const token = generateToken(userId);

    return NextResponse.json({
      user: { id: userId, username },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '注册失败' },
      { status: 500 }
    );
  }
}
