'use client';

import { useState, useEffect, useRef } from 'react';
import { worldEngine } from '../systems/WorldEngine';
import { beliefObserver } from '../systems/BeliefObserver';
import { Character, GameEvent, InternalState, BeliefSystem } from '../types/core';

export default function Home() {
  // 游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 世界状态
  const [characters, setCharacters] = useState<Character[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [playerBeliefs, setPlayerBeliefs] = useState<BeliefSystem | null>(null);
  const [internalStates, setInternalStates] = useState<Map<string, InternalState>>(new Map());
  
  // 输入状态
  const [inputMessage, setInputMessage] = useState('');
  const [inputMode, setInputMode] = useState<'dialogue' | 'action'>('dialogue');
  
  // 界面状态
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化世界引擎
  useEffect(() => {
    if (gameStarted) {
      console.log('🌍 初始化《本我之境》世界...');
      
      worldEngine.initializeWorld();
      worldEngine.startHeartbeat(45000); // 45秒心跳
      
      // 订阅世界事件
      const unsubscribe = worldEngine.subscribe((event: GameEvent) => {
        setEvents(prev => [...prev, event]);
      });
      
      // 定期更新状态
      const stateUpdateInterval = setInterval(() => {
        const worldState = worldEngine.getWorldState();
        setCharacters(Array.from(worldState.characters.values()));
        setInternalStates(new Map(worldState.internal_states));
        
        // 检查玩家信念更新
        const playerBelief = worldState.belief_systems.get('player');
        if (playerBelief) {
          setPlayerBeliefs(playerBelief);
        }
      }, 5000);
      
      return () => {
        unsubscribe();
        clearInterval(stateUpdateInterval);
        worldEngine.stopHeartbeat();
      };
    }
  }, [gameStarted]);

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  // 开始游戏
  const startGame = async () => {
    if (!playerName.trim()) return;
    
    setLoading(true);
    try {
      // 添加玩家到世界
      worldEngine.addPlayer(playerName);
      setGameStarted(true);
      
      // 发布玩家进入事件
      worldEngine.publishEvent({
        id: `player_enter_${Date.now()}`,
        type: 'environment',
        character_id: 'system',
        content: `${playerName} 推开酒馆厚重的木门，走进了昏暗的月影酒馆...`,
        timestamp: Date.now(),
        scene_id: 'moonlight_tavern'
      });
      
    } catch (error) {
      console.error('启动游戏失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const messageContent = inputMode === 'action' ? `(${inputMessage})` : inputMessage;
    
    // 发布玩家事件
    worldEngine.publishEvent({
      id: `player_${inputMode}_${Date.now()}`,
      type: inputMode,
      character_id: 'player',
      content: messageContent,
      timestamp: Date.now(),
      scene_id: 'moonlight_tavern'
    });
    
    setInputMessage('');
    
    // 触发AI响应
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: inputMessage,
          playerName: playerName,
          chatHistory: events.slice(-5).map(e => `${e.character_id}: ${e.content}`).join('\n'),
          inputType: inputMode
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.action_package) {
          // 发布AI响应事件
          if (result.action_package.dialogue) {
            worldEngine.publishEvent({
              id: `ai_response_${Date.now()}`,
              type: 'dialogue',
              character_id: result.character?.id || 'ai',
              content: result.action_package.dialogue,
              timestamp: Date.now(),
              scene_id: 'moonlight_tavern'
            });
          }
          
          if (result.action_package.action) {
            worldEngine.publishEvent({
              id: `ai_action_${Date.now()}`,
              type: 'action',
              character_id: result.character?.id || 'ai',
              content: result.action_package.action,
              timestamp: Date.now(),
              scene_id: 'moonlight_tavern'
            });
          }
        }
      }
    } catch (error) {
      console.error('AI响应失败:', error);
    }
  };

  // 获取角色头像
  const getCharacterAvatar = (characterId: string) => {
    if (characterId === 'player') return '🧑‍💼';
    if (characterId === 'linxi') return '👩‍🦱';
    if (characterId === 'chenhao') return '👨‍💻';
    if (characterId === 'system') return '🏛️';
    return '🎭';
  };

  // 获取角色名称
  const getCharacterName = (characterId: string) => {
    if (characterId === 'player') return playerName;
    const character = characters.find(c => c.id === characterId);
    return character?.name || characterId;
  };

  // 获取事件样式
  const getEventStyle = (event: GameEvent) => {
    switch (event.type) {
      case 'dialogue': return 'bg-blue-900/30 border-blue-500/30';
      case 'action': return 'bg-purple-900/30 border-purple-500/30';
      case 'environment': return 'bg-green-900/30 border-green-500/30';
      case 'system': return 'bg-gray-900/30 border-gray-500/30';
      default: return 'bg-gray-800/30 border-gray-600/30';
    }
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              🪞 《本我之镜》
            </h1>
            <h2 className="text-2xl text-yellow-300 mb-4">意识探索与演化的沙盒</h2>
            <p className="text-lg text-gray-300 mb-8">
              在这个世界中，你的信念系统将从行为中自然涌现。
              AI角色拥有自己的情绪和生活，即使你不说话，世界也在继续运行...
            </p>
          </div>

          <div className="bg-gray-800/70 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">🌙 月影酒馆</h3>
            <p className="text-gray-300 mb-4">
              昏暗的灯光下，木质桌椅散发着岁月的痕迹。空气中弥漫着酒精和烟草的味道，几位常客已经坐在各自习惯的位置...
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">👩‍🦱</span>
                  <div>
                    <h4 className="font-bold text-white">林溪</h4>
                    <p className="text-sm text-gray-400">经验丰富的调查员</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300">眼神锐利，善于观察细节，总是在分析每个人的行为模式</p>
              </div>
              
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">👨‍💻</span>
                  <div>
                    <h4 className="font-bold text-white">陈浩</h4>
                    <p className="text-sm text-gray-400">看似普通的年轻人</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300">内心藏着不为人知的秘密，容易紧张，试图保持低调</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-400/20 to-blue-500/20 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto border border-green-400/30 mb-8">
            <h3 className="text-2xl font-bold mb-4 text-green-300">🌟 陶子的分支预览页面 🌟</h3>
            <p className="text-lg text-green-200 mb-6">欢迎来到陶子的开发分支！</p>
            <div className="text-sm text-gray-300">
              <p>📍 当前分支: taozi-branch</p>
              <p>👤 开发者: 陶子</p>
              <p>🚀 状态: 活跃开发中</p>
            </div>
          </div>

          <div className="bg-gray-800/70 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4">👤 进入世界</h3>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="输入你的角色名字..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && startGame()}
              disabled={loading}
            />
            <button
              onClick={startGame}
              disabled={!playerName.trim() || loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg transition-all duration-300"
            >
              {loading ? '🌍 正在初始化世界...' : '🚪 踏入《本我之境》'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* 顶部状态栏 */}
        <div className="bg-gray-800/70 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                📊
              </button>
              <div>
                <h2 className="text-xl font-bold text-cyan-400">🌙 月影酒馆</h2>
                <p className="text-gray-300 text-sm">
                  {characters.length > 0 && '神秘而宁静的氛围'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">世界状态</div>
              <div className="text-green-400 text-sm">
                💓 心跳运行中 • {events.length} 事件
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* 左侧状态面板 */}
          <div className={`
            w-64 lg:w-72 xl:w-80 flex-shrink-0 overflow-y-auto transition-all duration-300
            ${sidebarOpen ? 'block absolute md:relative z-10 bg-gray-900/95 md:bg-transparent h-full' : 'hidden'} 
            md:block md:relative md:z-auto md:bg-transparent
          `}>
            {/* 角色状态 */}
            <div className="bg-gray-800/70 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-bold text-green-400 mb-3">👥 角色状态</h3>
              <div className="space-y-3">
                {characters.filter(c => c.type === 'ai_npc').map(char => {
                  const state = internalStates.get(char.id);
                  return (
                    <div key={char.id} className="bg-gray-700/50 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="text-xl mr-2">{getCharacterAvatar(char.id)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-white">{char.name}</div>
                          <div className="text-xs text-gray-400">{char.role}</div>
                        </div>
                      </div>
                      {state && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-400">能量</span>
                            <span className="text-white">{state.energy.toFixed(0)}</span>
                          </div>
                          <div className="bg-gray-600 rounded-full h-1">
                            <div 
                              className="bg-blue-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${state.energy}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-purple-400">无聊</span>
                            <span className="text-white">{state.boredom.toFixed(0)}</span>
                          </div>
                          <div className="bg-gray-600 rounded-full h-1">
                            <div 
                              className="bg-purple-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${state.boredom}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 信念系统 */}
            {playerBeliefs && playerBeliefs.confidence_score > 0 && (
              <div className="bg-gray-800/70 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold text-orange-400 mb-3">🔮 你的信念档案</h3>
                <div className="text-sm text-gray-300 space-y-2">
                  <p><strong>分析置信度:</strong> {(playerBeliefs.confidence_score * 100).toFixed(0)}%</p>
                  <p><strong>基于行为:</strong> {playerBeliefs.based_on_logs_count} 条</p>
                  
                  {playerBeliefs.values.length > 0 && (
                    <div>
                      <p className="text-yellow-400 font-medium mt-3">💎 价值观:</p>
                      {playerBeliefs.values.slice(0, 2).map((belief, i) => (
                        <p key={i} className="text-xs">• {belief.description}</p>
                      ))}
                    </div>
                  )}
                  
                  {playerBeliefs.selfview.length > 0 && (
                    <div>
                      <p className="text-green-400 font-medium mt-3">🪞 自我认知:</p>
                      {playerBeliefs.selfview.slice(0, 2).map((belief, i) => (
                        <p key={i} className="text-xs">• {belief.description}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 系统说明 */}
            <div className="bg-gray-800/70 rounded-lg p-4">
              <h3 className="text-lg font-bold text-orange-400 mb-3">🌍 系统特性</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>🔮 信念发现:</strong> 系统观察你的行为，自动生成信念档案</p>
                <p><strong>💓 活跃世界:</strong> AI每45秒进行一次"心跳"，可能自主行动</p>
                <p><strong>🎭 真实角色:</strong> AI有情绪状态，会根据心情变化行为</p>
                <p><strong>🌱 有机故事:</strong> 没有固定剧本，故事由互动自然演化</p>
              </div>
            </div>
          </div>

          {/* 右侧对话区域 */}
          <div className="flex-1 bg-gray-800/70 rounded-lg p-4 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-cyan-400">💬 实时世界</h3>
              <div className="text-xs text-gray-400">
                {events.length} 个事件
              </div>
            </div>
            
            {/* 事件流 */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
              {events.map(event => (
                <div key={event.id} className={`p-3 rounded-lg border ${getEventStyle(event)} animate-fade-in`}>
                  <div className="flex items-start space-x-2">
                    <span className="text-xl flex-shrink-0">{getCharacterAvatar(event.character_id)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white text-sm">
                          {getCharacterName(event.character_id)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">
                          {event.type === 'dialogue' ? '💬' : 
                           event.type === 'action' ? '🎭' : 
                           event.type === 'environment' ? '🌍' : '⚙️'}
                        </span>
                        {event.is_autonomous && (
                          <span className="text-xs px-1.5 py-0.5 bg-purple-600/30 border border-purple-500/30 rounded text-purple-300">
                            自主
                          </span>
                        )}
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed break-words">{event.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="space-y-2 border-t border-gray-600 pt-3">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setInputMessage(prev => prev + '@林溪 ')}
                    className="px-2 py-1 bg-purple-600/50 hover:bg-purple-600 text-white rounded text-xs transition-colors"
                  >
                    @林溪
                  </button>
                  <button
                    onClick={() => setInputMessage(prev => prev + '@陈浩 ')}
                    className="px-2 py-1 bg-blue-600/50 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                  >
                    @陈浩
                  </button>
                </div>
                
                <div className="flex space-x-1 bg-gray-700 rounded-md p-0.5">
                  <button
                    onClick={() => setInputMode('dialogue')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      inputMode === 'dialogue' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    💬 对话
                  </button>
                  <button
                    onClick={() => setInputMode('action')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      inputMode === 'action' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    🎭 行动
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    inputMode === 'dialogue' 
                      ? "与AI对话..." 
                      : "描述你的行动..."
                  }
                  className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className={`px-4 py-3 rounded-lg transition-colors font-medium text-white text-sm ${
                    inputMode === 'dialogue'
                      ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600'
                      : 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600'
                  }`}
                >
                  {inputMode === 'dialogue' ? '💬' : '🎭'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}