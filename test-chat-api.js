// 测试聊天API的脚本
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

console.log('🗣️ 开始测试聊天API...');

async function testChatAPI() {
  try {
    const testMessage = {
      userMessage: "你好，这里是什么地方？",
      playerName: "测试玩家",
      sessionId: "test_session_" + Date.now(),
      inputType: "dialogue"
    };

    console.log('📤 发送测试消息:', testMessage);

    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    const responseText = await response.text();
    console.log('📥 API响应状态:', response.status);
    console.log('📥 原始响应:', responseText);

    if (!response.ok) {
      console.error('❌ API调用失败:', response.status, response.statusText);
      console.error('错误详情:', responseText);
      return { success: false, error: responseText };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (err) {
      console.error('❌ 响应解析失败:', err.message);
      return { success: false, error: 'JSON解析失败: ' + responseText };
    }

    console.log('✅ API调用成功!');
    console.log('🎯 路由类型:', responseData.routing_type);
    console.log('👤 角色名称:', responseData.character?.name);
    console.log('💬 响应内容:', responseData.action_package?.dialogue);

    return { success: true, data: responseData };

  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error.message);
    return { success: false, error: error.message };
  }
}

// 执行测试
testChatAPI().then(result => {
  console.log('\n📊 聊天API测试结果:');
  if (result.success) {
    console.log('✅ 聊天API工作正常');
    console.log('🎉 基础聊天功能验证成功');
  } else {
    console.log('❌ 聊天API存在问题:', result.error);
    console.log('🔧 需要进一步调试和修复');
  }
}).catch(error => {
  console.error('❌ 测试脚本执行失败:', error.message);
});