// 测试Zep API认证的脚本
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

console.log('🔑 测试Zep API认证...');

async function testZepAuth() {
  const apiKey = process.env.ZEP_API_KEY;
  const endpoint = process.env.ZEP_ENDPOINT || 'https://api.getzep.com';
  
  console.log('📊 配置信息:');
  console.log('- Endpoint:', endpoint);
  console.log('- API Key存在:', !!apiKey);
  console.log('- API Key长度:', apiKey ? apiKey.length : 'N/A');
  console.log('- API Key前缀:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');

  if (!apiKey) {
    console.error('❌ ZEP_API_KEY环境变量缺失');
    return { success: false, error: 'API密钥缺失' };
  }

  // 测试不同的认证头格式和API版本
  const testConfigs = [
    {
      name: 'v2 Api-Key格式',
      url: `${endpoint}/api/v2/users`,
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' }
    },
    {
      name: 'v1 Api-Key格式', 
      url: `${endpoint}/api/v1/users`,
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' }
    },
    {
      name: 'v2 Bearer格式',
      url: `${endpoint}/api/v2/users`,
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    },
    {
      name: 'v1 Bearer格式',
      url: `${endpoint}/api/v1/users`, 
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    }
  ];

  const results = [];

  for (const config of testConfigs) {
    try {
      console.log(`\n🧪 测试: ${config.name}`);
      console.log(`📡 URL: ${config.url}`);
      
      const response = await fetch(config.url, {
        method: 'GET',
        headers: config.headers
      });

      const responseText = await response.text();
      
      const result = {
        name: config.name,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        response: responseText ? responseText.substring(0, 200) : 'No response body'
      };

      if (response.ok) {
        console.log(`✅ ${config.name}: 成功 (${response.status})`);
      } else {
        console.log(`❌ ${config.name}: 失败 (${response.status}) - ${response.statusText}`);
        console.log(`响应: ${result.response}`);
      }

      results.push(result);

    } catch (error) {
      console.log(`❌ ${config.name}: 异常 - ${error.message}`);
      results.push({
        name: config.name,
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: results.some(r => r.success),
    results,
    recommendations: generateRecommendations(results)
  };
}

function generateRecommendations(results) {
  const recommendations = [];
  
  if (!results.some(r => r.success)) {
    recommendations.push('所有认证方式都失败，请检查:');
    recommendations.push('1. API密钥是否正确');
    recommendations.push('2. 账户是否有效');
    recommendations.push('3. 网络连接是否正常');
    recommendations.push('4. Zep服务是否可用');
  } else {
    const successful = results.filter(r => r.success);
    recommendations.push(`建议使用: ${successful[0].name}`);
  }

  return recommendations;
}

// 执行测试
testZepAuth().then(result => {
  console.log('\n📊 Zep认证测试结果:');
  console.log('整体成功:', result.success ? '✅' : '❌');
  
  if (result.recommendations) {
    console.log('\n💡 建议:');
    result.recommendations.forEach(rec => console.log(`- ${rec}`));
  }
  
  if (!result.success) {
    console.log('\n🔧 可能的解决方案:');
    console.log('1. 检查Zep账户状态');
    console.log('2. 重新生成API密钥');
    console.log('3. 确认账户权限');
    console.log('4. 联系Zep技术支持');
  }
}).catch(error => {
  console.error('❌ 测试脚本执行失败:', error.message);
});