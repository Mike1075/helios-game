import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服务端key执行DDL操作
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 数据库Schema修复API
 * 添加缺失字段和修复数据类型
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 开始修复数据库Schema...');
    
    const results = {
      fixes: [] as any[],
      errors: [] as string[],
      success: true
    };

    // 1. 检查并添加scene_events表的metadata字段
    try {
      console.log('📋 检查scene_events表的metadata字段...');
      
      // 先测试字段是否存在
      const { data: testData, error: testError } = await supabaseAdmin
        .from('scene_events')
        .select('metadata')
        .limit(1);

      if (testError && testError.message.includes("does not exist")) {
        console.log('❌ metadata字段不存在，需要添加');
        
        // 使用SQL直接添加字段
        const { data: addResult, error: addError } = await supabaseAdmin
          .rpc('exec_sql', {
            sql: 'ALTER TABLE scene_events ADD COLUMN IF NOT EXISTS metadata JSONB;'
          });

        if (addError) {
          console.warn('⚠️ 无法通过RPC添加字段，记录问题:', addError.message);
          results.errors.push(`metadata字段添加失败: ${addError.message}`);
        } else {
          console.log('✅ metadata字段添加成功');
          results.fixes.push('添加scene_events.metadata字段');
        }
      } else {
        console.log('✅ metadata字段已存在');
        results.fixes.push('scene_events.metadata字段检查通过');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('❌ scene_events表检查失败:', errorMsg);
      results.errors.push(`scene_events检查失败: ${errorMsg}`);
    }

    // 2. 检查并修复character_states表的数据类型
    try {
      console.log('🔢 检查character_states表的数据类型...');
      
      // 测试插入小数值
      const testValue = 23.45;
      const { data: updateTest, error: updateError } = await supabaseAdmin
        .from('character_states')
        .update({ energy: testValue })
        .eq('character_id', 'linxi')
        .select();

      if (updateError && updateError.message.includes('invalid input syntax for type integer')) {
        console.log('❌ 数据类型错误，需要修复为DECIMAL');
        
        // 修复数据类型的SQL
        const alterQueries = [
          'ALTER TABLE character_states ALTER COLUMN energy TYPE DECIMAL(5,2);',
          'ALTER TABLE character_states ALTER COLUMN focus TYPE DECIMAL(5,2);',
          'ALTER TABLE character_states ALTER COLUMN curiosity TYPE DECIMAL(5,2);',
          'ALTER TABLE character_states ALTER COLUMN boredom TYPE DECIMAL(5,2);',
          'ALTER TABLE character_states ALTER COLUMN anxiety TYPE DECIMAL(5,2);',
          'ALTER TABLE character_states ALTER COLUMN suspicion TYPE DECIMAL(5,2);'
        ];

        for (const query of alterQueries) {
          try {
            const { error: alterError } = await supabaseAdmin.rpc('exec_sql', { sql: query });
            if (alterError) {
              console.warn(`⚠️ SQL执行失败: ${query}, 错误: ${alterError.message}`);
              results.errors.push(`数据类型修复失败: ${alterError.message}`);
            } else {
              console.log(`✅ 执行成功: ${query}`);
            }
          } catch (err) {
            console.warn(`⚠️ SQL执行异常: ${query}`);
            results.errors.push(`SQL执行异常: ${err instanceof Error ? err.message : '未知错误'}`);
          }
        }
        
        results.fixes.push('修复character_states数据类型为DECIMAL');
      } else {
        console.log('✅ 数据类型正确，可以存储小数');
        results.fixes.push('character_states数据类型检查通过');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('❌ character_states表检查失败:', errorMsg);
      results.errors.push(`character_states检查失败: ${errorMsg}`);
    }

    // 3. 创建缺失的character_memories表
    try {
      console.log('📝 检查character_memories表...');
      
      const { data: memoryTest, error: memoryError } = await supabaseAdmin
        .from('character_memories')
        .select('id')
        .limit(1);

      if (memoryError && memoryError.message.includes("does not exist")) {
        console.log('❌ character_memories表不存在，需要创建');
        
        const createTableSQL = `
          CREATE TABLE character_memories (
              id TEXT PRIMARY KEY DEFAULT ('memory_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9)),
              character_id TEXT NOT NULL,
              event_id TEXT,
              memory_type TEXT NOT NULL CHECK (memory_type IN ('interaction', 'observation', 'internal', 'belief_update')),
              content TEXT NOT NULL,
              emotional_weight DECIMAL(3,2) DEFAULT 0.5,
              timestamp BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
              metadata JSONB,
              created_at TIMESTAMPTZ DEFAULT now()
          );
          CREATE INDEX IF NOT EXISTS idx_character_memories_character_id ON character_memories(character_id);
        `;

        const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createTableSQL });
        
        if (createError) {
          console.warn('⚠️ 无法通过RPC创建表:', createError.message);
          results.errors.push(`character_memories表创建失败: ${createError.message}`);
        } else {
          console.log('✅ character_memories表创建成功');
          results.fixes.push('创建character_memories表');
        }
      } else {
        console.log('✅ character_memories表已存在');
        results.fixes.push('character_memories表检查通过');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('❌ character_memories表检查失败:', errorMsg);
      results.errors.push(`character_memories检查失败: ${errorMsg}`);
    }

    // 设置总体成功状态
    results.success = results.errors.length === 0;

    console.log('📊 Schema修复完成:', {
      fixes: results.fixes.length,
      errors: results.errors.length,
      success: results.success
    });

    return NextResponse.json({
      success: results.success,
      message: results.success ? 'Schema修复完成' : 'Schema修复部分失败',
      fixes: results.fixes,
      errors: results.errors,
      instructions: results.errors.length > 0 ? [
        '如果RPC方法不可用，请手动在Supabase SQL编辑器中执行:',
        '1. ALTER TABLE scene_events ADD COLUMN IF NOT EXISTS metadata JSONB;',
        '2. ALTER TABLE character_states ALTER COLUMN energy TYPE DECIMAL(5,2);',
        '3. (其他相同的数据类型修复)',
        '4. 执行database-schema.sql中的character_memories表创建语句'
      ] : null
    });

  } catch (error) {
    console.error('❌ Schema修复过程失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Schema修复失败: ${error instanceof Error ? error.message : '未知错误'}`,
        message: '请检查数据库连接和权限'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}