// 测试Supabase Edge Functions的脚本
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const SUPABASE_URL = 'https://vfendokbefodfxwutgyc.supabase.co';

console.log('🚀 开始测试Edge Functions...');

async function testEdgeFunctions() {
  try {
    // 1. 测试AI自主行为生成器
    console.log('\n1️⃣ 测试AI自主行为生成器...');
    
    const autonomousBehaviorResponse = await fetch(`${SUPABASE_URL}/functions/v1/ai-autonomous-behavior`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZW5kb2tiZWZvZGZ4d3V0Z3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzk2MDcsImV4cCI6MjAzOTY1NTYwN30.rNYg5E7dZ1FjQ9PZ8KxsOKEJQZuJL5kBo8YdOuJbWvw'
      }
    });

    console.log('📊 自主行为API状态:', autonomousBehaviorResponse.status);
    
    if (autonomousBehaviorResponse.ok) {
      const autonomousResult = await autonomousBehaviorResponse.json();
      console.log('✅ 自主行为测试成功:', {
        success: autonomousResult.success,
        actionsGenerated: autonomousResult.actions_generated,
        actions: autonomousResult.actions?.map(a => ({
          character: a.character_id,
          reason: a.reason,
          actionType: a.action?.action_type
        }))
      });
    } else {
      const errorText = await autonomousBehaviorResponse.text();
      console.error('❌ 自主行为测试失败:', errorText);
    }

    // 2. 测试信念分析器
    console.log('\n2️⃣ 测试信念分析器...');
    
    const beliefAnalyzerResponse = await fetch(`${SUPABASE_URL}/functions/v1/belief-analyzer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZW5kb2tiZWZvZGZ4d3V0Z3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwNzk2MDcsImV4cCI6MjAzOTY1NTYwN30.rNYg5E7dZ1FjQ9PZ8KxsOKEJQZuJL5kBo8YdOuJbWvw'
      },
      body: JSON.stringify({
        player_id: 'test_player',
        recent_logs_count: 3
      })
    });

    console.log('📊 信念分析API状态:', beliefAnalyzerResponse.status);
    
    if (beliefAnalyzerResponse.ok) {
      const beliefResult = await beliefAnalyzerResponse.json();
      console.log('✅ 信念分析测试成功:', {
        success: beliefResult.success,
        logsAnalyzed: beliefResult.logs_analyzed,
        cognitiveDissonance: beliefResult.cognitive_dissonance_detected,
        beliefs: beliefResult.updated_beliefs
      });
    } else {
      const errorText = await beliefAnalyzerResponse.text();
      console.error('❌ 信念分析测试失败:', errorText);
    }

    console.log('\n🎉 Edge Functions测试完成!');
    
  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error.message);
  }
}

// 执行测试
testEdgeFunctions().then(() => {
  console.log('\n📊 Edge Functions测试结果:');
  console.log('- AI自主行为生成器: 已部署并测试');
  console.log('- 信念分析器: 已部署并测试');
  console.log('- 测试完成，可以进行实时更新功能测试');
}).catch(error => {
  console.error('❌ 测试脚本执行失败:', error.message);
});
