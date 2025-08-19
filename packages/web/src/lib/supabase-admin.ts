/**
 * 统一的Supabase管理员客户端
 * 用于服务端操作，绕过RLS策略
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// 管理员客户端 - 用于API路由中的数据库操作
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 检查环境变量配置
export function checkSupabaseConfig() {
  const config = {
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service_key: !!process.env.SUPABASE_SERVICE_KEY,
    ai_gateway_key: !!process.env.AI_GATEWAY_API_KEY,
    zep_key: !!process.env.ZEP_API_KEY
  };

  console.log('🔑 环境变量检查:', config);
  
  return config;
}

// 数据库操作辅助函数
export async function withErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  operationName: string
): Promise<T | null> {
  try {
    const { data, error } = await operation();
    
    if (error) {
      console.error(`${operationName} 失败:`, error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`${operationName} 异常:`, error);
    return null;
  }
}