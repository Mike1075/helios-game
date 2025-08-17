'use client';

import { useState, useEffect, useRef } from 'react';
import { worldEngine } from '../systems/WorldEngine';
import { beliefObserver } from '../systems/BeliefObserver';
import { Character, GameEvent, InternalState, BeliefSystem } from '../types/core';
// 移除前端直接调用，改为通过API路由调用

export default function Home() {
  // 游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  // 世界状态
  const [characters, setCharacters] = useState<Character[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [playerBeliefs, setPlayerBeliefs] = useState<BeliefSystem | null>(null);
  const [internalStates, setInternalStates] = useState<Map<string, InternalState>>(new Map());
  
  // 输入状态
  const [inputMessage, setInputMessage] = useState('');
  const [inputMode, setInputMode] = useState<'dialogue' | 'action'>('dialogue');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // 界面状态
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化世界引擎
  useEffect(() => {
    if (gameStarted) {
      console.log('🌍 初始化《本我之境》世界...');
      
      worldEngine.initializeWorld();
      worldEngine.startHeartbeat(120000); // 2分钟心跳，配合3分钟AI行动冷却
      
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
      // 通过API路由初始化游戏会话
      console.log('🔄 初始化游戏会话...');
      const initResponse = await fetch('/api/init-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName })
      });
      
      if (!initResponse.ok) {
        throw new Error('游戏初始化失败');
      }
      
      const { sessionId: newSessionId } = await initResponse.json();
      setSessionId(newSessionId);
      
      // 添加玩家到世界
      worldEngine.addPlayer(playerName);
      setGameStarted(true);
      
      // 发布玩家进入事件
      const enterEvent = {
        id: `player_enter_${Date.now()}`,
        type: 'environment' as const,
        character_id: 'system',
        content: `${playerName} 推开酒馆厚重的木门，走进了昏暗的月影酒馆...`,
        timestamp: Date.now(),
        scene_id: 'moonlight_tavern'
      };
      
      worldEngine.publishEvent(enterEvent);
      
      console.log('✅ 游戏初始化完成');
      
    } catch (error) {
      console.error('❌ 启动游戏失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || sendingMessage) return;
    
    setSendingMessage(true);
    const messageContent = inputMode === 'action' ? `(${inputMessage})` : inputMessage;
    
    try {
      // 发布玩家事件
      const playerEvent = {
        id: `player_${inputMode}_${Date.now()}`,
        type: inputMode as const,
        character_id: 'player',
        content: messageContent,
        timestamp: Date.now(),
        scene_id: 'moonlight_tavern'
      };
      
      worldEngine.publishEvent(playerEvent);
      setInputMessage('');
      
      // 通过API路由处理完整的消息流程（包含Zep保存和AI响应）
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: inputMessage,
          playerName: playerName,
          sessionId: sessionId,
          inputType: inputMode
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.action_package) {
          const characterId = result.character?.id || 'ai';
          
          // 发布AI响应事件（排除内心想法，只显示对话和行动）
          if (result.action_package.dialogue) {
            const dialogueEvent = {
              id: `ai_response_${Date.now()}`,
              type: 'dialogue' as const,
              character_id: characterId,
              content: result.action_package.dialogue,
              timestamp: Date.now(),
              scene_id: 'moonlight_tavern'
            };
            
            worldEngine.publishEvent(dialogueEvent);
          }
          
          if (result.action_package.action) {
            const actionEvent = {
              id: `ai_action_${Date.now()}`,
              type: 'action' as const,
              character_id: characterId,
              content: result.action_package.action,
              timestamp: Date.now(),
              scene_id: 'moonlight_tavern'
            };
            
            worldEngine.publishEvent(actionEvent);
          }
          
          // 注意：internal_thought 被故意排除，不会发布到事件流中
          
          console.log('✅ AI响应处理完成:', {
            character: result.character?.name,
            routing: result.routing_type
          });
        }
      }
    } catch (error) {
      console.error('❌ 消息处理失败:', error);
      // 添加用户友好的错误提示
      const errorEvent = {
        id: `error_${Date.now()}`,
        type: 'system' as const,
        character_id: 'system',
        content: '抱歉，消息发送失败，请稍后重试。',
        timestamp: Date.now(),
        scene_id: 'moonlight_tavern'
      };
      worldEngine.publishEvent(errorEvent);
    } finally {
      setSendingMessage(false);
    }
  };

  // 万能AI角色映射
  const universalAIRoles: Record<string, { name: string; avatar: string }> = {
    'tavern_keeper': { name: '老板', avatar: '👨‍💼' },
    'bartender': { name: '酒保', avatar: '🍺' },
    'cook': { name: '厨师', avatar: '👨‍🍳' },
    'local_resident': { name: '当地居民', avatar: '🧔' },
    'guard': { name: '守卫', avatar: '🛡️' }
  };

  // 获取角色头像
  const getCharacterAvatar = (characterId: string) => {
    if (characterId === 'player') return '🧑‍💼';
    if (characterId === 'linxi') return '👩‍🦱';
    if (characterId === 'chenhao') return '👨‍💻';
    if (characterId === 'system') return '🏛️';
    
    // 万能AI角色
    const universalRole = universalAIRoles[characterId];
    if (universalRole) return universalRole.avatar;
    
    return '🎭';
  };

  // 获取角色名称
  const getCharacterName = (characterId: string) => {
    if (characterId === 'player') return playerName;
    
    // 万能AI角色
    const universalRole = universalAIRoles[characterId];
    if (universalRole) return universalRole.name;
    
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                🎭 赫利俄斯项目 MVP
              </h1>
              <h2 className="text-2xl text-yellow-300 mb-2">本我之镜</h2>
              <p className="text-lg text-gray-300">AI驱动的意识探索与演化沙盒游戏</p>
            </div>
            
            <div className="border-t border-b border-cyan-500 py-4 mb-8">
              <p className="text-cyan-300 text-lg">
                ✨ 不预设信念，从行为中发现真相 ✨
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-blue-500/30">
              <h3 className="text-xl font-bold text-blue-400 mb-2">🧠 AI意识模拟</h3>
              <p className="text-gray-300">每个AI拥有独立的内在状态和动态信念系统</p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-xl border border-purple-500/30">
              <h3 className="text-xl font-bold text-purple-400 mb-2">💓 活跃世界</h3>
              <p className="text-gray-300">45秒心跳驱动，AI自主生活，世界永不停息</p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-xl border border-green-500/30">
              <h3 className="text-xl font-bold text-green-400 mb-2">🔮 信念观察者</h3>
              <p className="text-gray-300">从AI行为中自动推断世界观、自我观、价值观</p>
            </div>
          </div>

          {/* Main Game Card */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-gray-800/70 hover:bg-gray-800 rounded-xl p-8 border border-red-500/50 ring-2 ring-red-500/30 transform hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                 onClick={startGame}>
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🌍</div>
                <h3 className="text-3xl font-bold text-red-400 group-hover:text-cyan-400 transition-colors mb-2">
                  世界引擎 - 活着的世界
                </h3>
                <div className="text-red-300 text-lg font-medium mb-4">🔥 推荐体验</div>
                <p className="text-gray-300 text-lg leading-relaxed">
                  🚀 实时世界模拟器：AI拥有自主生活，世界永不停止，信念从行为中自然涌现
                </p>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
                <h4 className="text-xl font-bold text-cyan-400 mb-4">🌙 月影酒馆</h4>
                <p className="text-gray-300 mb-4">
                  昏暗的灯光下，木质桌椅散发着岁月的痕迹。空气中弥漫着酒精和烟草的味道，几位常客已经坐在各自习惯的位置...
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-600/50 p-4 rounded-lg border border-purple-500/30">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">👩‍🦱</span>
                      <div>
                        <h5 className="font-bold text-white">林溪</h5>
                        <p className="text-sm text-gray-400">经验丰富的调查员</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300">眼神锐利，善于观察细节，总是在分析每个人的行为模式</p>
                  </div>
                  
                  <div className="bg-gray-600/50 p-4 rounded-lg border border-blue-500/30">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">👨‍💻</span>
                      <div>
                        <h5 className="font-bold text-white">陈浩</h5>
                        <p className="text-sm text-gray-400">看似普通的年轻人</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300">内心藏着不为人知的秘密，容易紧张，试图保持低调</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-400/20 to-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30 mb-6">
                <h4 className="text-xl font-bold mb-3 text-green-300">🌟 陶子的分支预览页面</h4>
                <p className="text-green-200 mb-4">欢迎来到陶子的开发分支！体验最新的世界引擎架构</p>
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-300">
                  <div>📍 分支: taozi-branch</div>
                  <div>👤 开发者: 陶子</div>
                  <div>🚀 状态: 活跃开发中</div>
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-lg p-6">
                <h4 className="text-xl font-bold text-green-400 mb-4">👤 创建你的角色</h4>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="输入你的角色名字..."
                  className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 mb-4 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && startGame()}
                  disabled={loading}
                />
                <button
                  onClick={startGame}
                  disabled={!playerName.trim() || loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg transition-all duration-300 text-lg"
                >
                  {loading ? '🌍 正在初始化世界...' : '🚪 踏入《本我之境》'}
                </button>
              </div>

              <div className="w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full opacity-70 group-hover:opacity-100 transition-opacity mt-6"></div>
            </div>
          </div>

          {/* System Features */}
          <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">🌍 终极架构体验</h3>
            <p className="text-gray-300 mb-3">
              全新推出 <span className="text-cyan-400 font-bold">🌍 世界引擎 - 活着的世界</span>！
              AI角色拥有真正的自主生活，世界永不停止运转。
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>🚀 实时世界模拟、AI自主行为</div>
              <div>💭 内心想法完全隐藏，保持神秘感</div>
              <div>🔮 信念系统动态生成，观察行为</div>
              <div>⚡ 45秒心跳驱动，活跃世界</div>
            </div>
          </div>

          {/* Technical Info */}
          <div className="text-center text-gray-500 text-sm mt-8">
            <p>🔧 基于 Next.js + TypeScript + Mike的AI架构</p>
            <p>📚 世界引擎 + 信念观察者 + 动态角色系统</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
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
                <h2 className="text-xl font-bold text-cyan-400">📍 🌙 月影酒馆</h2>
                <p className="text-gray-300 text-sm">
                  昏暗的灯光下，木质桌椅散发着岁月的痕迹。空气中弥漫着酒精和烟草的味道。
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">世界状态</div>
              <div className="text-green-400 text-sm">
                💓 心跳运行中 • {events.length} 个事件
              </div>
              <div className="flex items-center mt-1">
                <div className="w-20 bg-gray-700 rounded-full h-2 mr-2">
                  <div 
                    className="bg-red-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `30%` }}
                  ></div>
                </div>
                <span className="text-red-400 text-xs">紧张度 30%</span>
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
            {/* 核心AI角色状态 */}
            <div className="bg-gray-800/70 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-bold text-green-400 mb-3">👥 核心AI角色</h3>
              <div className="space-y-3">
                {characters.filter(c => c.type === 'ai_npc').map(char => {
                  const state = internalStates.get(char.id);
                  return (
                    <div key={char.id} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/30">
                      <div className="flex items-center mb-2">
                        <span className="text-xl mr-2">{getCharacterAvatar(char.id)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-white">{char.name}</div>
                          <div className="text-xs text-gray-400">{char.role}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">
                        {char.id === 'linxi' ? '眼神锐利，善于观察细节，总是在分析每个人的行为模式' : 
                         char.id === 'chenhao' ? '内心藏着不为人知的秘密，容易紧张，试图保持低调' : 
                         char.description}
                      </p>
                      {state && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-400">能量</span>
                            <span className="text-white">{state.energy.toFixed(0)}%</span>
                          </div>
                          <div className="bg-gray-600 rounded-full h-1">
                            <div 
                              className="bg-blue-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${state.energy}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-purple-400">无聊值</span>
                            <span className="text-white">{state.boredom.toFixed(0)}%</span>
                          </div>
                          <div className="bg-gray-600 rounded-full h-1">
                            <div 
                              className="bg-purple-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${state.boredom}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-purple-400 mt-1">
                            情绪: {state.energy > 70 ? '精力充沛' : state.energy > 40 ? '略显疲惫' : '低落'}
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
              <h3 className="text-lg font-bold text-orange-400 mb-3">🌌 系统说明</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>🎭 真实体验：</strong>你只能看到其他人的对话和行动，无法看到内心想法</p>
                <p><strong>🧠 核心AI：</strong>林溪、陈浩拥有独立人格和复杂内在状态</p>
                <p><strong>🎭 万能AI：</strong>智能扮演老板、酒保、厨师、居民、守卫等角色</p>
                <p><strong>🧠 智能路由：</strong>根据内容自动选择最合适的角色回应</p>
                <p><strong>⚡ 零硬编码：</strong>所有回复都是实时AI生成，真正的智能对话</p>
                <p><strong>🔮 信念发现:</strong> 系统观察你的行为，自动生成信念档案</p>
                <p><strong>💓 活跃世界:</strong> AI每2分钟进行一次"心跳"，可能自主行动</p>
                <p><strong>⏰ 智能冷却：</strong>AI自主行动有3分钟冷却，避免频繁打扰</p>
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
              {events.map((event, index) => (
                <div 
                  key={event.id} 
                  className={`p-3 rounded-lg border ${getEventStyle(event)} transition-all duration-300 ease-in-out hover:scale-[1.01]`}
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-xl flex-shrink-0">{getCharacterAvatar(event.character_id)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white text-sm">
                          {getCharacterName(event.character_id)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString('zh-CN', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })}
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

            {/* 优化的输入区域 */}
            <div className="space-y-2 border-t border-gray-600 pt-3">
              {/* 快捷指令和模式切换 */}
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex flex-wrap space-x-1 md:space-x-2">
                  {/* 核心AI角色 */}
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
                  
                  {/* 万能AI测试按钮 */}
                  <button
                    onClick={() => setInputMessage('老板，来杯酒')}
                    className="px-2 py-1 bg-orange-600/50 hover:bg-orange-600 text-white rounded text-xs transition-colors"
                    title="测试万能AI - 酒馆老板"
                  >
                    🍺老板
                  </button>
                  <button
                    onClick={() => setInputMessage('厨师，有什么好吃的？')}
                    className="px-2 py-1 bg-red-600/50 hover:bg-red-600 text-white rounded text-xs transition-colors"
                    title="测试万能AI - 厨师"
                  >
                    👨‍🍳厨师
                  </button>
                  
                  <button
                    onClick={() => setInputMessage('')}
                    className="px-2 py-1 bg-gray-600/50 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                  >
                    清空
                  </button>
                </div>
                
                {/* 输入模式切换按钮 */}
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
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && !sendingMessage && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || sendingMessage}
                  className={`px-4 py-3 rounded-lg transition-colors font-medium text-white text-sm ${
                    inputMode === 'dialogue'
                      ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600'
                      : 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600'
                  }`}
                >
                  {sendingMessage ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">发送中</span>
                    </div>
                  ) : (
                    inputMode === 'dialogue' ? '💬' : '🎭'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}