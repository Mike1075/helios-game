import { NextRequest, NextResponse } from 'next/server';

/**
 * 调试Supabase连接问题的详细API
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始调试Supabase连接...');
    
    // 检查所有环境变量
    const envVars = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
      NODE_ENV: process.env.NODE_ENV
    };

    // 显示环境变量状态（不显示完整值）
    const envCheck = Object.entries(envVars).reduce((acc, [key, value]) => {
      acc[key] = {
        exists: !!value,
        length: value?.length || 0,
        preview: value ? `${value.substring(0, 20)}...` : 'missing'
      };
      return acc;
    }, {} as any);

    console.log('📊 环境变量检查:', envCheck);

    // 尝试基础的fetch测试（不使用Supabase client）
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase credentials',
        envCheck
      }, { status: 500 });
    }

    // 测试1: 直接HTTP请求到Supabase REST API
    console.log('🌐 测试直接HTTP请求...');
    const testUrl = `${supabaseUrl}/rest/v1/scene_events?select=count`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('📡 HTTP响应状态:', response.status);
    console.log('📡 HTTP响应头:', Object.fromEntries(response.headers.entries()));

    let responseData = null;
    let responseText = '';
    
    try {
      responseText = await response.text();
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.log('📄 响应文本:', responseText);
    }

    // 测试2: 检查Supabase项目健康状态
    console.log('🏥 检查项目健康状态...');
    const healthUrl = `${supabaseUrl}/rest/v1/`;
    const healthResponse = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey
      }
    });

    return NextResponse.json({
      success: response.ok,
      debug_info: {
        environment_variables: envCheck,
        supabase_url_used: supabaseUrl?.substring(0, 50) + '...',
        api_key_used: supabaseKey?.substring(0, 20) + '...',
        direct_http_test: {
          url: testUrl,
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          response_preview: responseText?.substring(0, 200),
          parsed_data: responseData
        },
        health_check: {
          status: healthResponse.status,
          ok: healthResponse.ok
        }
      }
    });

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}