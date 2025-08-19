'use client';

console.log('🚨 EMERGENCY TEST - 简单页面加载成功！');

export default function TestPage() {
  console.log('🚨 EMERGENCY TEST - 组件渲染成功！');
  
  return (
    <div style={{ padding: '20px', fontSize: '24px', color: 'red' }}>
      <h1>🚨 紧急测试页面</h1>
      <p>如果你能看到这个页面，说明React正常工作</p>
      <p>请检查Console是否有日志输出</p>
      <button onClick={() => {
        console.log('🚨 EMERGENCY TEST - 按钮点击成功！');
        alert('按钮点击成功！');
      }}>
        点击测试JavaScript
      </button>
    </div>
  );
}