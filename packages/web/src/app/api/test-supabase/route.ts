import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 测试Supabase连接的简单API
 */
export async function GET(request: NextRequest) {
  try {
    // 获取环境变量
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    console.log('🔍 测试Supabase连接...');
    console.log('URL存在:', !!supabaseUrl);
    console.log('Anon Key存在:', !!supabaseAnonKey);
    console.log('Service Key存在:', !!supabaseServiceKey);

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase环境变量缺失',
        details: {
          url: !!supabaseUrl,
          anonKey: !!supabaseAnonKey,
          serviceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }

    // 测试1：使用anon key连接
    console.log('📡 测试anon key连接...');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    // 简单的健康检查 - 获取数据库时间
    const { data: timeData, error: timeError } = await supabaseAnon
      .rpc('now') // PostgreSQL的now()函数
      .single();

    console.log('⏰ 数据库时间查询结果:', { timeData, timeError });

    // 测试2：检查表是否存在
    console.log('📋 检查表结构...');
    const { data: tablesData, error: tablesError } = await supabaseAnon
      .from('scene_events')
      .select('count(*)', { count: 'exact', head: true });

    console.log('📊 scene_events表查询结果:', { tablesData, tablesError });

    // 测试3：使用service key（如果存在）
    let serviceKeyTest = null;
    if (supabaseServiceKey) {
      console.log('🔑 测试service key连接...');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('scene_events')
        .select('count(*)', { count: 'exact', head: true });
      
      serviceKeyTest = { success: !adminError, error: adminError?.message };
      console.log('🛡️ service key测试结果:', serviceKeyTest);
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase连接测试完成',
      tests: {
        environment_vars: {
          url: !!supabaseUrl,
          anonKey: !!supabaseAnonKey,
          serviceKey: !!supabaseServiceKey,
          url_preview: supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : 'missing'
        },
        database_time: {
          success: !timeError,
          error: timeError?.message,
          data: timeData
        },
        anon_table_access: {
          success: !tablesError,
          error: tablesError?.message,
          count: tablesData
        },
        service_key_test: serviceKeyTest
      }
    });

  } catch (error) {
    console.error('❌ Supabase测试失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}