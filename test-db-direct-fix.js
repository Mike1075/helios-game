// 测试直接数据库修复的脚本
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

console.log('🔧 开始测试直接数据库修复...');

async function testDirectFix() {
  try {
    const response = await fetch('http://localhost:3001/api/fix-db-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const responseData = await response.json();
    
    console.log('📊 修复结果:', {
      success: responseData.success,
      fixes: responseData.fixes?.length || 0,
      errors: responseData.errors?.length || 0
    });

    if (responseData.fixes?.length > 0) {
      console.log('\n✅ 成功项目:');
      responseData.fixes.forEach((fix, i) => console.log(`${i + 1}. ${fix}`));
    }

    if (responseData.errors?.length > 0) {
      console.log('\n❌ 问题列表:');
      responseData.errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }

    if (responseData.suggestions?.length > 0) {
      console.log('\n💡 修复建议:');
      responseData.suggestions.forEach((suggestion, i) => console.log(`${i + 1}. ${suggestion}`));
    }

    return responseData;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

testDirectFix();