import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * 数据库表结构修复API
 * 修复缺失的字段和约束
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 开始修复数据库表结构...');

    const results = {
      character_states_fix: null as any,
      belief_systems_fix: null as any,
      errors: [] as string[]
    };

    // 1. 修复character_states表 - 添加缺失的last_autonomous_action字段
    try {
      const { data: alterResult, error: alterError } = await supabase.rpc('sql', {
        query: `
          ALTER TABLE character_states 
          ADD COLUMN IF NOT EXISTS last_autonomous_action BIGINT DEFAULT 0;
        `
      });

      if (alterError) {
        // 如果RPC不可用，尝试直接添加数据
        console.warn('无法使用RPC修改表结构，尝试数据修复:', alterError.message);
        results.character_states_fix = {
          success: false,
          method: 'rpc_failed',
          error: alterError.message
        };
      } else {
        results.character_states_fix = {
          success: true,
          method: 'alter_table',
          result: alterResult
        };
        console.log('✅ character_states表结构修复成功');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      results.errors.push(`character_states修复失败: ${errorMsg}`);
      results.character_states_fix = {
        success: false,
        method: 'exception',
        error: errorMsg
      };
    }

    // 2. 尝试直接插入数据测试表是否工作
    try {
      const testStateData = {
        character_id: 'test_character',
        energy: 75.0,
        focus: 80.0,
        curiosity: 70.0,
        boredom: 60.0,
        anxiety: 30.0,
        suspicion: 60.0,
        last_updated: Date.now()
      };

      const { data: insertTest, error: insertError } = await supabase
        .from('character_states')
        .upsert(testStateData, { 
          onConflict: 'character_id',
          ignoreDuplicates: false 
        })
        .select();

      if (insertError) {
        console.error('测试插入失败:', insertError);
        results.errors.push(`测试插入失败: ${insertError.message}`);
      } else {
        console.log('✅ 测试插入成功:', insertTest);
        // 清理测试数据
        await supabase.from('character_states').delete().eq('character_id', 'test_character');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      results.errors.push(`测试插入异常: ${errorMsg}`);
    }

    // 3. 测试belief_systems表
    try {
      const testBeliefData = {
        character_id: 'test_belief',
        worldview: [{ belief: "测试信念", strength: 0.5 }],
        selfview: [{ belief: "测试自我", strength: 0.5 }],
        values: [{ belief: "测试价值", strength: 0.5 }],
        last_updated: Date.now(),
        based_on_logs_count: 0,
        confidence_score: 0.5
      };

      const { data: beliefTest, error: beliefError } = await supabase
        .from('belief_systems')
        .upsert(testBeliefData, { 
          onConflict: 'character_id',
          ignoreDuplicates: false 
        })
        .select();

      if (beliefError) {
        console.error('belief_systems测试插入失败:', beliefError);
        results.belief_systems_fix = {
          success: false,
          error: beliefError.message
        };
        results.errors.push(`belief_systems测试失败: ${beliefError.message}`);
      } else {
        console.log('✅ belief_systems测试插入成功:', beliefTest);
        results.belief_systems_fix = {
          success: true,
          result: beliefTest
        };
        // 清理测试数据
        await supabase.from('belief_systems').delete().eq('character_id', 'test_belief');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      results.errors.push(`belief_systems测试异常: ${errorMsg}`);
      results.belief_systems_fix = {
        success: false,
        error: errorMsg
      };
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      message: '数据库修复检查完成',
      results,
      next_steps: results.errors.length > 0 
        ? '需要手动在Supabase控制台执行数据库迁移脚本'
        : '可以尝试重新运行init-db API'
    });

  } catch (error) {
    console.error('❌ 数据库修复失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `数据库修复失败: ${error instanceof Error ? error.message : '未知错误'}` 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}