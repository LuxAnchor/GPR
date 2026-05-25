import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/init-db';

export async function GET() {
  try {
    const success = await initializeDatabase();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: '数据库初始化成功' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: '数据库初始化失败' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      success: false, 
      error: '数据库初始化失败' 
    }, { status: 500 });
  }
}
