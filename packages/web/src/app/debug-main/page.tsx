'use client';

import { useState, useEffect } from 'react';

console.log('🔍 DEBUG-MAIN: 文件开始加载');

export default function DebugMainPage() {
  console.log('🔍 DEBUG-MAIN: 组件开始渲染');
  
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  
  // 测试useEffect是否工作
  useEffect(() => {
    console.log('🔍 DEBUG-MAIN: useEffect触发，gameStarted:', gameStarted);
  }, [gameStarted]);
  
  const startGame = () => {
    console.log('🔍 DEBUG-MAIN: startGame被调用');
    setGameStarted(true);
    console.log('🔍 DEBUG-MAIN: gameStarted设置为true');
  };
  
  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#1a1a2e' }}>
      <h1>🔍 主页面调试版本</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>gameStarted: {gameStarted ? 'true' : 'false'}</p>
        <p>playerName: {playerName}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="输入角色名..."
          style={{ padding: '10px', marginRight: '10px' }}
        />
        <button
          onClick={startGame}
          style={{ padding: '10px 20px', backgroundColor: '#4a90e2', color: 'white', border: 'none' }}
        >
          开始游戏
        </button>
      </div>
      
      {gameStarted && (
        <div style={{ padding: '20px', backgroundColor: '#2a2a3e', marginTop: '20px' }}>
          <h2>🎮 游戏已开始</h2>
          <p>玩家：{playerName}</p>
          <p>如果你看到这个，说明React状态管理正常工作</p>
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
        <p>请检查Console中的DEBUG-MAIN日志</p>
        <p>正常应该看到：文件加载 → 组件渲染 → useEffect触发</p>
      </div>
    </div>
  );
}