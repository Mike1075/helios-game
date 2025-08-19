// 数据库状态检测脚本
// 这个脚本会检查数据库的真实状态，不会降级或敷衍

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 从环境变量获取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 开始检查数据库状态...');
console.log('URL:', supabaseUrl ? '已配置' : '❌ 未配置');
console.log('Key:', supabaseKey ? '已配置' : '❌ 未配置');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 环境变量配置不完整，无法连接数据库');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStatus() {
  const results = {
    connection: false,
    tables: {},
    errors: []
  };

  try {
    // 1. 检查基础连接
    console.log('\n📡 检查数据库连接...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('character_states')
      .select('character_id')
      .limit(1);

    if (connectionError) {
      console.error('❌ 数据库连接失败:', connectionError.message);
      results.errors.push(`连接失败: ${connectionError.message}`);
      return results;
    }
    
    results.connection = true;
    console.log('✅ 数据库连接成功');

    // 2. 检查关键表是否存在
    const requiredTables = [
      'character_states',
      'scene_events', 
      'character_memories',
      'belief_systems',
      'agent_logs',
      'player_events'
    ];

    console.log('\n📋 检查必要的数据表...');
    
    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.error(`❌ 表 ${tableName} 检查失败:`, error.message);
          results.tables[tableName] = {
            exists: false,
            error: error.message
          };
          results.errors.push(`表 ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ 表 ${tableName} 存在且可访问`);
          results.tables[tableName] = {
            exists: true,
            sampleCount: data ? data.length : 0
          };
        }
      } catch (err) {
        console.error(`❌ 表 ${tableName} 检查异常:`, err.message);
        results.tables[tableName] = {
          exists: false,
          error: err.message
        };
        results.errors.push(`表 ${tableName} 异常: ${err.message}`);
      }
    }

    // 3. 检查character_states表的数据类型
    console.log('\n🔍 检查character_states表结构...');
    try {
      const { data: statesData, error: statesError } = await supabase
        .from('character_states')
        .select('character_id, energy, focus, curiosity, boredom')
        .limit(1);

      if (statesError) {
        console.error('❌ character_states 数据类型检查失败:', statesError.message);
        results.errors.push(`character_states 数据类型: ${statesError.message}`);
      } else {
        console.log('✅ character_states 表结构正常');
      }
    } catch (err) {
      console.error('❌ character_states 表结构异常:', err.message);
      results.errors.push(`character_states 结构异常: ${err.message}`);
    }

  } catch (error) {
    console.error('❌ 数据库检查过程中发生异常:', error.message);
    results.errors.push(`检查异常: ${error.message}`);
  }

  return results;
}

// 执行检查
checkDatabaseStatus().then(results => {
  console.log('\n📊 数据库状态检查结果:');
  console.log('连接状态:', results.connection ? '✅ 正常' : '❌ 失败');
  console.log('表状态:', Object.keys(results.tables).length, '个表被检查');
  
  if (results.errors.length > 0) {
    console.log('\n🚨 发现的问题:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    console.log('\n❌ 数据库存在问题，需要修复');
    process.exit(1);
  } else {
    console.log('\n✅ 数据库状态正常');
    process.exit(0);
  }
}).catch(error => {
  console.error('❌ 检查脚本执行失败:', error.message);
  process.exit(1);
});