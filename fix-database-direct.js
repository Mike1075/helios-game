// 直接修复数据库的脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 直接修复数据库结构...');

async function fixDatabase() {
  try {
    // 1. 尝试调用Supabase Edge Function来创建表
    console.log('🚀 尝试调用edge function创建表...');
    
    // 首先测试能否连接到数据库
    const { data: testData, error: testError } = await supabase
      .from('character_states')
      .select('character_id')
      .limit(1);

    if (testError) {
      throw new Error(`数据库连接失败: ${testError.message}`);
    }

    console.log('✅ 数据库连接正常');

    // 2. 尝试使用Supabase的RPC功能执行SQL
    console.log('📝 尝试通过RPC创建缺失的表...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS character_memories (
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

    // 方法1: 尝试使用rpc
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', {
        sql: createTableSQL
      });

      if (rpcError) {
        console.log('⚠️ RPC方法失败:', rpcError.message);
      } else {
        console.log('✅ 通过RPC成功创建表');
        return { success: true, method: 'rpc' };
      }
    } catch (err) {
      console.log('⚠️ RPC调用异常:', err.message);
    }

    // 方法2: 尝试直接插入到schema管理表
    console.log('🔄 尝试其他方法...');
    
    // 3. 检查现有表结构
    console.log('📋 检查现有表结构...');
    const tables = [
      'character_states',
      'scene_events', 
      'belief_systems',
      'agent_logs',
      'player_events'
    ];

    const results = {};
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        results[table] = {
          exists: !error,
          error: error?.message,
          sampleData: data
        };

        if (error) {
          console.log(`❌ 表 ${table}: ${error.message}`);
        } else {
          console.log(`✅ 表 ${table}: 存在且可访问`);
        }
      } catch (err) {
        results[table] = {
          exists: false,
          error: err.message
        };
        console.log(`❌ 表 ${table}: ${err.message}`);
      }
    }

    return {
      success: false,
      needsManualIntervention: true,
      existingTables: results,
      instructions: {
        message: '需要手动在Supabase控制台创建character_memories表',
        sql: createTableSQL,
        steps: [
          '1. 登录 https://supabase.com/dashboard',
          '2. 选择你的项目',
          '3. 进入 SQL Editor',
          '4. 执行上面的 createTableSQL',
          '5. 重新运行测试脚本'
        ]
      }
    };

  } catch (error) {
    console.error('❌ 修复过程失败:', error.message);
    return {
      success: false,
      error: error.message,
      suggestions: [
        '检查网络连接',
        '确认Supabase服务状态',
        '验证环境变量配置',
        '联系数据库管理员'
      ]
    };
  }
}

// 执行修复
fixDatabase().then(result => {
  console.log('\n📊 数据库修复结果:');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.needsManualIntervention) {
    console.log('\n🔧 需要手动干预:');
    console.log(result.instructions.message);
    console.log('\n📝 执行以下SQL:');
    console.log(result.instructions.sql);
    console.log('\n📋 步骤:');
    result.instructions.steps.forEach(step => console.log(step));
  }
}).catch(error => {
  console.error('❌ 脚本执行失败:', error.message);
});