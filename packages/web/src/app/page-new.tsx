'use client';

import { useState, useEffect, useRef } from 'react';
import ChamberOfEchoes from '@/components/ChamberOfEchoes';

// 简化的类型定义
interface Character {
  id: string;
  name: string;
  role: string;
  type: 'core_npc' | 'dynamic_npc' | 'system';
}

interface GameEvent {
  id: string;
  character_id: string;
  content: string;
  timestamp: number;
  event_type: string;
  scene_id: string;
  metadata?: any;
}

interface GameState {
  characters: Character[];
  events: GameEvent[];
  scene_id: string;
}

export default function Home() {
  // 基础游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  // 游戏数据状态
  const [gameState, setGameState] = useState<GameState>({
    characters: [
      { id: 'linxi', name: '林溪', role: '神秘调查员', type: 'core_npc' },
      { id: 'chenhao', name: '陈浩', role: '温和酒保', type: 'core_npc' }
    ],
    events: [],
    scene_id: 'moonlight_tavern'
  });
  
  // 回响之室状态
  const [chamberOpen, setChamberOpen] = useState(false);
  
  // 输入状态
  const [inputMessage, setInputMessage] = useState('');
  const [inputMode, setInputMode] = useState<'dialogue' | 'action'>('dialogue');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // 消息滚动引用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.events]);

  // 启动AI自主行为的心跳
  useEffect(() => {
    if (!gameStarted || !sessionId) return;
    
    // 每30秒触发一次AI自主行为检查
    const heartbeatInterval = setInterval(async () => {
      try {
        console.log('💓 触发AI自主行为检查...');
        await fetch('/api/game-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'trigger_autonomous_behavior',
            payload: {
              sessionId,
              playerName
            }
          })
        });
      } catch (error) {
        console.error('AI自主行为检查失败:', error);
      }
    }, 30000); // 30秒间隔

    return () => clearInterval(heartbeatInterval);
  }, [gameStarted, sessionId, playerName]);

  // 开始游戏
  const startGame = async () => {
    if (!playerName.trim()) return;
    
    setLoading(true);
    try {
      // 初始化游戏会话
      const response = await fetch('/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'init_game',
          payload: {
            playerName: playerName.trim()
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSessionId(result.sessionId || `session_${Date.now()}`);
          setGameStarted(true);
          
          // 加载初始游戏状态
          await loadGameState();
          
          console.log('🎮 游戏启动成功');
        }
      } else {
        alert('游戏启动失败，请检查网络连接');
      }
    } catch (error) {
      console.error('启动游戏失败:', error);
      alert('游戏启动失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 加载游戏状态
  const loadGameState = async () => {
    try {
      const response = await fetch('/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_game_state',
          payload: {}
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setGameState(result.gameState);
        }
      }
    } catch (error) {
      console.error('加载游戏状态失败:', error);
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage || !sessionId) return;
    
    setSendingMessage(true);
    const messageContent = inputMode === 'action' ? `(${inputMessage})` : inputMessage;
    
    try {
      // 添加玩家消息到本地状态
      const playerEvent: GameEvent = {
        id: `player_${Date.now()}`,
        character_id: 'player',
        content: messageContent,
        timestamp: Date.now(),
        event_type: inputMode,
        scene_id: 'moonlight_tavern'
      };
      
      setGameState(prev => ({
        ...prev,
        events: [...prev.events, playerEvent]
      }));
      
      setInputMessage('');
      
      // 通过统一API发送消息
      const response = await fetch('/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          payload: {
            userMessage: inputMessage,
            playerName,
            sessionId,
            inputType: inputMode
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('🎯 聊天响应:', result);
        
        if (result.success && result.response) {
          // 添加AI响应到本地状态
          const aiEvent: GameEvent = {
            id: `ai_${Date.now()}`,
            character_id: result.character?.id || 'ai',
            content: result.response,
            timestamp: Date.now(),
            event_type: 'dialogue',
            scene_id: 'moonlight_tavern'
          };
          
          setGameState(prev => ({
            ...prev,
            events: [...prev.events, aiEvent],
            characters: result.new_character_created && result.character ? 
              [...prev.characters.filter(c => c.id !== result.character.id), result.character] : 
              prev.characters
          }));
        }
      } else {
        const errorText = await response.text();
        console.error('❌ 聊天请求失败:', response.status, errorText);
        
        // 添加错误消息
        const errorEvent: GameEvent = {
          id: `error_${Date.now()}`,
          character_id: 'system',
          content: `聊天服务暂时不可用 (${response.status})`,
          timestamp: Date.now(),
          event_type: 'system',
          scene_id: 'moonlight_tavern'
        };
        
        setGameState(prev => ({
          ...prev,
          events: [...prev.events, errorEvent]
        }));
      }
    } catch (error) {
      console.error('❌ 发送消息异常:', error);
      
      // 添加错误消息
      const errorEvent: GameEvent = {
        id: `error_${Date.now()}`,
        character_id: 'system',
        content: `网络连接错误: ${(error as Error).message}`,
        timestamp: Date.now(),
        event_type: 'system',
        scene_id: 'moonlight_tavern'
      };
      
      setGameState(prev => ({
        ...prev,
        events: [...prev.events, errorEvent]
      }));
    } finally {
      setSendingMessage(false);
    }
  };

  // 触发回响之室
  const triggerChamber = async () => {
    if (!gameStarted || !playerName) {
      alert('请先开始游戏！');
      return;
    }
    
    try {
      const response = await fetch('/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_chamber',
          payload: {
            playerId: 'player',
            playerName,
            triggerContext: '你在月影酒馆中的种种经历，让你感到内心深处某种微妙的冲突正在觉醒...'
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setChamberOpen(true);
        }
      } else {
        alert('回响之室暂时无法使用');
      }
    } catch (error) {
      console.error('触发回响之室失败:', error);
      alert('网络错误，请稍后再试');
    }
  };

  // 获取角色名称
  const getCharacterName = (characterId: string) => {
    if (characterId === 'player') return playerName;
    if (characterId === 'system') return '系统';
    
    const character = gameState.characters.find(c => c.id === characterId);
    return character?.name || characterId;
  };

  // 获取角色头像
  const getCharacterAvatar = (characterId: string) => {
    if (characterId === 'player') return '🧑‍💼';
    if (characterId === 'linxi') return '👩‍🦱';
    if (characterId === 'chenhao') return '👨‍💻';
    if (characterId === 'system') return '🏛️';
    return '🎭';
  };

  // 处理Enter键发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🌙</div>
            <h1 className="text-3xl font-bold text-white mb-2">月影酒馆</h1>
            <p className="text-purple-200 mb-6">一个神秘的地方，等待着你的故事...</p>
            
            <div className="space-y-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="请输入你的名字..."
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:border-purple-400 focus:outline-none"
                disabled={loading}
              />
              
              <button
                onClick={startGame}
                disabled={!playerName.trim() || loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100"
              >
                {loading ? '正在进入...' : '进入酒馆'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* 顶部栏 */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌙</span>
            <h1 className="text-xl font-bold text-white">月影酒馆</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-purple-200">欢迎, {playerName}</span>
            <button
              onClick={triggerChamber}
              className="bg-purple-600/80 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              🪞 回响之室
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-1 max-w-6xl mx-auto w-full flex gap-6 p-6">
        
        {/* 角色面板 */}
        <aside className="w-64 bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">在场角色</h3>
          <div className="space-y-3">
            {gameState.characters.map(character => (
              <div key={character.id} className="bg-white/10 rounded-lg p-3 border border-white/20">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getCharacterAvatar(character.id)}</span>
                  <div>
                    <div className="text-white font-medium">{character.name}</div>
                    <div className="text-purple-200 text-sm">{character.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 聊天区域 */}
        <section className="flex-1 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col">
          
          {/* 消息列表 */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[500px]">
            {gameState.events.length === 0 ? (
              <div className="text-center text-purple-200 py-8">
                <div className="text-4xl mb-4">🍺</div>
                <p>酒馆很安静，开始你的对话吧...</p>
              </div>
            ) : (
              gameState.events.map(event => (
                <div key={event.id} className="flex space-x-3">
                  <span className="text-2xl flex-shrink-0">
                    {getCharacterAvatar(event.character_id)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-medium">
                        {getCharacterName(event.character_id)}
                      </span>
                      <span className="text-xs text-purple-300">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-purple-100 bg-white/5 rounded-lg p-3 border border-white/10">
                      {event.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center space-x-2 mb-3">
              <button
                onClick={() => setInputMode('dialogue')}
                className={`px-3 py-1 rounded text-sm ${
                  inputMode === 'dialogue' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/20 text-purple-200'
                }`}
              >
                💬 对话
              </button>
              <button
                onClick={() => setInputMode('action')}
                className={`px-3 py-1 rounded text-sm ${
                  inputMode === 'action' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white/20 text-purple-200'
                }`}
              >
                🎭 行动
              </button>
            </div>
            
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  inputMode === 'dialogue' ? '说些什么...' : '描述你的行动...'
                }
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-purple-400 focus:outline-none"
                disabled={sendingMessage}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || sendingMessage}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:cursor-not-allowed"
              >
                {sendingMessage ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 回响之室组件 */}
      <ChamberOfEchoes
        isOpen={chamberOpen}
        playerId="player"
        playerName={playerName}
        onClose={() => setChamberOpen(false)}
      />
    </div>
  );
}