import { NextRequest, NextResponse } from 'next/server';

/**
 * 测试环境变量加载情况
 */
export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      // 检查所有Supabase相关环境变量
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_URL_value: process.env.SUPABASE_URL ? 'loaded' : 'missing',
      
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL_value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'loaded' : 'missing',
      
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      SUPABASE_ANON_KEY_value: process.env.SUPABASE_ANON_KEY ? 'loaded' : 'missing',
      
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'loaded' : 'missing',
      
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      SUPABASE_SERVICE_KEY_value: process.env.SUPABASE_SERVICE_KEY ? 'loaded' : 'missing',
      
      // 其他环境变量
      AI_GATEWAY_API_KEY: !!process.env.AI_GATEWAY_API_KEY,
      ZEP_API_KEY: !!process.env.ZEP_API_KEY,
      ZEP_ENDPOINT: !!process.env.ZEP_ENDPOINT,
      
      // 显示实际的URL前缀（不显示完整key）
      SUPABASE_URL_prefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'not found',
      NEXT_PUBLIC_SUPABASE_URL_prefix: process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'not found'
    };

    return NextResponse.json({
      success: true,
      message: '环境变量检查完成',
      environment: process.env.NODE_ENV,
      env_check: envCheck
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}