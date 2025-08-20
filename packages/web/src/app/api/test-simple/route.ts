import { NextRequest, NextResponse } from 'next/server';

/**
 * 最简单的测试API - 不依赖任何外部服务
 * 用于验证基础API功能和环境变量访问
 */
export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
      },
      AI_GATEWAY_API_KEY: {
        exists: !!process.env.AI_GATEWAY_API_KEY,
        value: process.env.AI_GATEWAY_API_KEY?.substring(0, 20) + '...',
      }
    };

    return NextResponse.json({
      success: true,
      message: '简单测试API工作正常',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      env_check: envCheck,
      api_status: 'OK'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'POST请求成功',
      received_data: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,  
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}