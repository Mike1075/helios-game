// 创建缺失数据表的脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 开始创建缺失的数据表...');

async function createMissingTables() {
  try {
    // 1. 创建character_memories表
    console.log('📝 创建character_memories表...');
    
    const { data: memoryResult, error: memoryError } = await supabase
      .from('character_memories')
      .insert([{
        character_id: 'test_create',
        memory_type: 'test',
        content: '测试内容',
        emotional_weight: 0.5,
        timestamp: Date.now()
      }])
      .select();

    if (memoryError) {
      if (memoryError.message.includes('does not exist')) {
        console.log('❌ character_memories表不存在，需要在Supabase控制台手动创建');
        console.log('\n📋 请在Supabase SQL编辑器中执行以下SQL:');
        console.log(`
CREATE TABLE IF NOT EXISTS character_memories (
    id TEXT PRIMARY KEY DEFAULT ('memory_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9)),
    character_id TEXT NOT NULL,
    event_id TEXT,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('interaction', 'observation', 'internal', 'belief_update')),
    content TEXT NOT NULL,
    emotional_weight DECIMAL(3,2) DEFAULT 0.5,
    timestamp BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (event_id) REFERENCES scene_events(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_character_memories_character_id ON character_memories(character_id);
        `);
        return { needsManualCreation: true, table: 'character_memories' };
      } else {
        console.error('❌ character_memories表测试失败:', memoryError.message);
        return { success: false, error: memoryError.message };
      }
    } else {
      console.log('✅ character_memories表存在且可用');
      // 清理测试数据
      await supabase.from('character_memories').delete().eq('character_id', 'test_create');
      return { success: true, table: 'character_memories' };
    }

  } catch (error) {
    console.error('❌ 脚本执行失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 执行创建
createMissingTables().then(result => {
  if (result.needsManualCreation) {
    console.log('\n🔄 请手动在Supabase控制台执行上述SQL后重新运行数据库测试');
  } else if (result.success) {
    console.log('\n✅ 所有表都已存在并可用');
  } else {
    console.log('\n❌ 表创建失败:', result.error);
  }
}).catch(error => {
  console.error('❌ 脚本执行异常:', error.message);
});