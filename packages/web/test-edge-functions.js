/**
 * Supabase Edge Functions 集成测试脚本
 * 
 * 这个脚本测试完整的核心游戏循环流程：
 * 1. 调用 belief-analyzer 边缘函数
 * 2. 调用 ai-autonomous-behavior 边缘函数
 * 3. 验证数据库记录和实时订阅系统
 */

import { createClient } from '@supabase/supabase-js';

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  console.log('请确保设置了以下环境变量:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeFunctions() {
  console.log('🧪 开始 Supabase Edge Functions 集成测试...\n');

  // 测试 1: belief-analyzer 边缘函数
  console.log('📊 测试 1: belief-analyzer 边缘函数');
  try {
    console.log('调用 belief-analyzer 边缘函数...');
    
    const { data: beliefResult, error: beliefError } = await supabase.functions.invoke('belief-analyzer', {
      body: {
        player_id: 'test_player',
        recent_logs_count: 3
      }
    });

    if (beliefError) {
      console.error('❌ belief-analyzer 错误:', beliefError);
    } else {
      console.log('✅ belief-analyzer 成功');
      console.log('响应:', JSON.stringify(beliefResult, null, 2));
    }
  } catch (error) {
    console.error('❌ belief-analyzer 异常:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试 2: ai-autonomous-behavior 边缘函数
  console.log('🤖 测试 2: ai-autonomous-behavior 边缘函数');
  try {
    console.log('调用 ai-autonomous-behavior 边缘函数...');
    
    const { data: behaviorResult, error: behaviorError } = await supabase.functions.invoke('ai-autonomous-behavior', {
      body: {}
    });

    if (behaviorError) {
      console.error('❌ ai-autonomous-behavior 错误:', behaviorError);
    } else {
      console.log('✅ ai-autonomous-behavior 成功');
      console.log('响应:', JSON.stringify(behaviorResult, null, 2));
    }
  } catch (error) {
    console.error('❌ ai-autonomous-behavior 异常:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试 3: 数据库连接和表结构
  console.log('🗄️ 测试 3: 数据库表结构验证');
  
  const tables = [
    'agent_logs',
    'belief_systems', 
    'character_states',
    'scene_events',
    'player_events'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.log(`❌ 表 "${table}" 访问失败:`, error.message);
      } else {
        console.log(`✅ 表 "${table}" 访问正常`);
      }
    } catch (error) {
      console.log(`❌ 表 "${table}" 异常:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 测试 4: 实时订阅测试
  console.log('📡 测试 4: 实时订阅系统');
  try {
    const channel = supabase
      .channel('test_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public', 
          table: 'scene_events'
        },
        (payload) => {
          console.log('📨 收到实时事件:', payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`📡 订阅状态: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('✅ 实时订阅成功建立');
          
          // 清理订阅
          setTimeout(() => {
            channel.unsubscribe();
            console.log('🧹 测试订阅已清理');
          }, 2000);
        }
      });

  } catch (error) {
    console.error('❌ 实时订阅测试失败:', error.message);
  }

  console.log('\n🎉 Supabase Edge Functions 集成测试完成!');
}

// 运行测试
testEdgeFunctions().catch(error => {
  console.error('💥 测试失败:', error);
  process.exit(1);
});