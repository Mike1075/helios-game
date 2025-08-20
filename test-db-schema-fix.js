// 测试数据库Schema修复的脚本
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

console.log('🔧 开始测试数据库Schema修复...');

async function testSchemaFix() {
  try {
    console.log('📡 调用Schema修复API...');
    
    const response = await fetch('http://localhost:3001/api/fix-db-schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const responseText = await response.text();
    console.log('📥 API响应状态:', response.status);
    
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
      console.error('原始响应:', responseText);
      return { success: false, error: 'JSON解析失败: ' + responseText };
    }

    console.log('✅ Schema修复API调用成功!');
    console.log('📊 修复结果:', {
      success: responseData.success,
      fixes: responseData.fixes?.length || 0,
      errors: responseData.errors?.length || 0
    });

    if (responseData.fixes && responseData.fixes.length > 0) {
      console.log('\n✅ 成功修复:');
      responseData.fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix}`);
      });
    }

    if (responseData.errors && responseData.errors.length > 0) {
      console.log('\n❌ 发现问题:');
      responseData.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (responseData.instructions) {
      console.log('\n📋 手动操作指导:');
      responseData.instructions.forEach((instruction, index) => {
        console.log(`${index + 1}. ${instruction}`);
      });
    }

    return { success: true, data: responseData };

  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error.message);
    return { success: false, error: error.message };
  }
}

// 执行测试
testSchemaFix().then(result => {
  console.log('\n📊 Schema修复测试结果:');
  if (result.success) {
    console.log('✅ Schema修复测试完成');
    if (result.data.success) {
      console.log('🎉 数据库Schema已成功修复');
    } else {
      console.log('⚠️ Schema修复部分成功，可能需要手动干预');
    }
  } else {
    console.log('❌ Schema修复测试失败:', result.error);
    console.log('🔧 可能需要手动修复数据库Schema');
  }
}).catch(error => {
  console.error('❌ 测试脚本执行失败:', error.message);
});