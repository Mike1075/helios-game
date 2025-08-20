import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 直接数据库修复API - 不使用RPC
 * 通过实际操作来测试和修复问题
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 开始直接数据库修复...');
    
    const results = {
      checks: {} as any,
      fixes: [] as string[],
      errors: [] as string[]
    };

    // 1. 测试scene_events表的metadata字段
    try {
      console.log('📋 测试scene_events.metadata字段...');
      
      // 尝试插入一个带metadata的测试记录
      const testEventData = {
        character_id: 'test_fix',
        event_type: 'system',
        content: 'Schema修复测试',
        metadata: { test: true, timestamp: Date.now() },
        timestamp: Date.now()
      };

      const { data: insertResult, error: insertError } = await supabaseAdmin
        .from('scene_events')
        .insert(testEventData)
        .select();

      if (insertError) {
        console.error('❌ metadata字段不存在或有问题:', insertError.message);
        results.checks.metadata_field = {
          exists: false,
          error: insertError.message,
          needs_fix: true
        };
        results.errors.push(`scene_events.metadata字段问题: ${insertError.message}`);
      } else {
        console.log('✅ metadata字段正常工作');
        results.checks.metadata_field = {
          exists: true,
          test_success: true
        };
        results.fixes.push('scene_events.metadata字段检查通过');
        
        // 清理测试数据
        await supabaseAdmin
          .from('scene_events')
          .delete()
          .eq('character_id', 'test_fix');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('❌ metadata字段测试失败:', errorMsg);
      results.errors.push(`metadata字段测试失败: ${errorMsg}`);
    }

    // 2. 测试character_states数据类型
    try {
      console.log('🔢 测试character_states数据类型...');
      
      // 尝试更新一个小数值
      const testDecimalValue = 23.96;
      const { data: updateResult, error: updateError } = await supabaseAdmin
        .from('character_states')
        .update({ energy: testDecimalValue })
        .eq('character_id', 'linxi')
        .select();

      if (updateError) {
        console.error('❌ 数据类型错误:', updateError.message);
        results.checks.decimal_types = {
          works: false,
          error: updateError.message,
          needs_fix: true
        };
        results.errors.push(`数据类型问题: ${updateError.message}`);
      } else {
        console.log('✅ 数据类型正常，可以存储小数');
        results.checks.decimal_types = {
          works: true,
          test_value: testDecimalValue,
          result: updateResult
        };
        results.fixes.push('character_states数据类型检查通过');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('❌ 数据类型测试失败:', errorMsg);
      results.errors.push(`数据类型测试失败: ${errorMsg}`);
    }

    // 3. 测试character_memories表
    try {
      console.log('📝 测试character_memories表...');
      
      const testMemoryData = {
        character_id: 'test_memory',
        memory_type: 'internal',
        content: 'Schema修复测试记忆',
        emotional_weight: 0.75,
        timestamp: Date.now()
      };

      const { data: memoryResult, error: memoryError } = await supabaseAdmin
        .from('character_memories')
        .insert(testMemoryData)
        .select();

      if (memoryError) {
        console.error('❌ character_memories表问题:', memoryError.message);
        results.checks.memory_table = {
          exists: false,
          error: memoryError.message,
          needs_creation: true
        };
        results.errors.push(`character_memories表问题: ${memoryError.message}`);
      } else {
        console.log('✅ character_memories表正常工作');
        results.checks.memory_table = {
          exists: true,
          test_success: true,
          result: memoryResult
        };
        results.fixes.push('character_memories表检查通过');
        
        // 清理测试数据
        await supabaseAdmin
          .from('character_memories')
          .delete()
          .eq('character_id', 'test_memory');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('❌ character_memories表测试失败:', errorMsg);
      results.errors.push(`character_memories表测试失败: ${errorMsg}`);
    }

    // 4. 检查现有数据完整性
    try {
      console.log('🔍 检查现有数据...');
      
      // 检查有多少数据
      const { data: eventsCount, error: eventsError } = await supabaseAdmin
        .from('scene_events')
        .select('id', { count: 'exact', head: true });
        
      const { data: statesCount, error: statesError } = await supabaseAdmin
        .from('character_states')
        .select('character_id', { count: 'exact', head: true });

      results.checks.data_integrity = {
        scene_events_count: eventsError ? 'error' : eventsCount,
        character_states_count: statesError ? 'error' : statesCount,
        scene_events_error: eventsError?.message,
        character_states_error: statesError?.message
      };

      if (!eventsError && !statesError) {
        results.fixes.push('数据完整性检查通过');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('❌ 数据完整性检查失败:', errorMsg);
      results.errors.push(`数据完整性检查失败: ${errorMsg}`);
    }

    // 生成修复建议
    const suggestions = [];
    
    if (results.checks.metadata_field && !results.checks.metadata_field.exists) {
      suggestions.push('需要在Supabase SQL编辑器中执行: ALTER TABLE scene_events ADD COLUMN metadata JSONB;');
    }
    
    if (results.checks.decimal_types && !results.checks.decimal_types.works) {
      suggestions.push('需要修复character_states表的数据类型为DECIMAL(5,2)');
    }
    
    if (results.checks.memory_table && !results.checks.memory_table.exists) {
      suggestions.push('需要创建character_memories表（执行database-schema.sql中的相关部分）');
    }

    const success = results.errors.length === 0;

    console.log('📊 直接数据库修复完成:', {
      success,
      fixes: results.fixes.length,
      errors: results.errors.length
    });

    return NextResponse.json({
      success,
      message: success ? '数据库Schema检查通过' : '发现需要修复的问题',
      checks: results.checks,
      fixes: results.fixes,
      errors: results.errors,
      suggestions: suggestions.length > 0 ? suggestions : null,
      manual_fix_required: suggestions.length > 0
    });

  } catch (error) {
    console.error('❌ 直接数据库修复失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `数据库修复失败: ${error instanceof Error ? error.message : '未知错误'}`,
        message: '请检查数据库连接和配置'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}