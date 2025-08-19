export default function PureTestPage() {
  // 完全不使用'use client'，纯静态HTML + 内联JavaScript
  
  return (
    <html>
      <head>
        <title>Pure Test</title>
      </head>
      <body style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#1a1a2e', color: 'white' }}>
        <h1>🧪 纯净测试页面</h1>
        <p>这个页面不依赖任何React功能</p>
        
        <div>
          <input type="text" id="nameInput" placeholder="输入名字" style={{ padding: '10px', marginRight: '10px' }} />
          <button id="startBtn" style={{ padding: '10px 20px', backgroundColor: '#4a90e2', color: 'white', border: 'none' }}>
            开始测试
          </button>
        </div>
        
        <div id="result" style={{ marginTop: '20px', padding: '20px', backgroundColor: '#2a2a3e' }}>
          点击按钮查看结果
        </div>
        
        <script dangerouslySetInnerHTML={{
          __html: `
            console.log('🧪 PURE TEST: 脚本开始执行');
            
            document.addEventListener('DOMContentLoaded', function() {
              console.log('🧪 PURE TEST: DOM加载完成');
              
              const btn = document.getElementById('startBtn');
              const input = document.getElementById('nameInput');
              const result = document.getElementById('result');
              
              if (btn && input && result) {
                console.log('🧪 PURE TEST: 元素获取成功');
                
                btn.addEventListener('click', function() {
                  console.log('🧪 PURE TEST: 按钮被点击');
                  const name = input.value;
                  result.innerHTML = '✅ 成功！名字是：' + name + '<br>时间：' + new Date().toLocaleTimeString();
                });
              } else {
                console.error('🧪 PURE TEST: 元素获取失败');
              }
            });
          `
        }} />
      </body>
    </html>
  );
}