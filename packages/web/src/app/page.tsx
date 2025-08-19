'use client';

import { useState, useEffect, useRef } from 'react';

// 立即执行的测试日志
console.log('🚀 [CRITICAL TEST] page.tsx文件开始加载 - 时间戳:', Date.now());
import { worldEngine } from '../systems/WorldEngine';
import { beliefObserver } from '../systems/BeliefObserver';
import { Character, GameEvent, InternalState, BeliefSystem } from '../types/core';
import { realtimeManager } from '@/lib/realtime-subscription';
import { passiveObserver } from '@/lib/passive-observer';
import { dynamicCharacterManager } from '@/lib/dynamic-character-manager';
import ChamberOfEchoes from '@/components/ChamberOfEchoes';
// 移除前端直接调用，改为通过API路由调用

export default function Home() {
  console.log('🔥 [CRITICAL TEST] Home组件开始渲染 - 时间戳:', Date.now());
  
  // 游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  // 会话控制状态
  const [sessionStats, setSessionStats] = useState({
    remainingTime: 180000, // 3分钟
    remainingCalls: 300,
    aiCallCount: 0,
    totalCost: 0,
    warning: null as string | null,
    sessionActive: true
  });
  
  // 世界状态
  const [characters, setCharacters] = useState<Character[]>([]);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [playerBeliefs, setPlayerBeliefs] = useState<BeliefSystem | null>(null);
  const [internalStates, setInternalStates] = useState<Map<string, InternalState>>(new Map());
  
  // 实时订阅状态
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
  
  // 心跳监控状态
  const [heartbeatCount, setHeartbeatCount] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>('');
  
  // 初始游戏状态
  const [sceneDescription, setSceneDescription] = useState<string>('');
  const [activeCharacters, setActiveCharacters] = useState<any[]>([]);
  const [ambientActivity, setAmbientActivity] = useState<string[]>([]);
  
  // 统一的角色管理：包括固定角色和动态角色
  const [allCharacters, setAllCharacters] = useState<any[]>([
    { id: 'linxi', name: '林溪', role: '神秘调查员', type: 'core_npc' },
    { id: 'chenhao', name: '陈浩', role: '温和酒保', type: 'core_npc' }
  ]);
  
  // 回响之室状态  
  const [chamberOpen, setChamberOpen] = useState(false);
  const [chamberEventId, setChamberEventId] = useState<string>('');
  
  // 输入状态
  const [inputMessage, setInputMessage] = useState('');
  const [inputMode, setInputMode] = useState<'dialogue' | 'action'>('dialogue');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // 界面状态
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 会话监控定时器引用
  const sessionMonitorRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化世界引擎和被动观察体验
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect触发，gameStarted:', gameStarted, 'playerName:', playerName);
    if (gameStarted) {
      console.log('🌍 [DEBUG v2.0] 游戏已开始，初始化《本我之境》世界...');
      
      let passiveObserverCleanup: (() => void) | null = null;
      
      // 异步初始化世界引擎和被动观察
      const initializeGame = async () => {
        try {
          console.log('🚀 [DEBUG v2.0] 开始初始化世界引擎...');
          // 1. 初始化世界引擎
          await worldEngine.initializeWorld();
          console.log('✅ [DEBUG v2.0] 世界引擎初始化完成');
          
          // 2. 设置被动观察体验
          passiveObserverCleanup = await passiveObserver.setupPassiveObservation(
            playerName,
            'moonlight_tavern',
            {
              onInitialState: (initialState) => {
                console.log('🎭 收到初始游戏状态:', initialState);
                setSceneDescription(initialState.sceneDescription);
                setActiveCharacters(initialState.activeCharacters);
                setAmbientActivity(initialState.ambientActivity);
                
                // 将最近的事件添加到事件流
                const eventFlow = initialState.recentEvents.map(event => ({
                  id: event.id,
                  type: (event.type as any) || 'system',
                  character_id: 'system', // 使用系统作为角色ID
                  content: `${event.character_name}: ${event.content}`,
                  timestamp: event.timestamp,
                  scene_id: 'moonlight_tavern',
                  is_autonomous: event.is_autonomous
                }));
                setEvents(prev => [...prev, ...eventFlow]);
              },
              onSceneEvent: (event) => {
                console.log('🎭 被动观察 - 收到场景事件:', event);
                setRealtimeEvents(prev => [...prev, { ...event, type: 'scene' }]);
                
                // 添加到主事件流（来自被动观察）
                setEvents(prev => [...prev, {
                  id: event.id,
                  type: (event.type as any) || 'system',
                  character_id: 'ai_character',
                  content: `${event.character_name}: ${event.content}`,
                  timestamp: event.timestamp,
                  scene_id: 'moonlight_tavern',
                  is_autonomous: event.is_autonomous
                }]);
              },
              onCharacterStateChange: (stateChange) => {
                console.log('🤖 被动观察 - 角色状态变化:', stateChange);
                // 可以在这里更新角色状态显示
                setEvents(prev => [...prev, {
                  id: `state_change_${Date.now()}`,
                  type: 'environment',
                  character_id: 'system',
                  content: `${stateChange.character_name} ${stateChange.status}`,
                  timestamp: Date.now(),
                  scene_id: 'moonlight_tavern',
                  is_autonomous: true
                }]);
              }
            }
          );
          console.log('✅ 被动观察体验初始化完成');
          
        } catch (error) {
          console.error('❌ 游戏初始化失败:', error);
        }
      };
      
      initializeGame();
      
      worldEngine.startHeartbeat(45000); // 45秒心跳，配合1分钟AI行动冷却
      
      // 订阅世界事件
      const unsubscribe = worldEngine.subscribe((event: GameEvent) => {
        setEvents(prev => [...prev, event]);
      });
      
      // 启动实时订阅
      const cleanupRealtime = realtimeManager.enterScene('moonlight_tavern', 'player');
      
      // 注册实时事件回调
      const unsubscribeScene = realtimeManager.onSceneEvent((event) => {
        console.log('🎭 收到场景事件:', event);
        setRealtimeEvents(prev => [...prev, { ...event, type: 'scene' }]);
        
        // 添加到主事件流
        const gameEvent = {
          id: event.id,
          type: event.event_type,
          character_id: event.character_id,
          content: event.content,
          timestamp: event.timestamp,
          scene_id: event.scene_id,
          is_autonomous: event.is_autonomous
        };
        setEvents(prev => [...prev, gameEvent]);
        
        // 检查是否是角色创建事件
        if (event.metadata?.character_creation && event.metadata?.character_data) {
          const newChar = {
            id: event.metadata.created_character,
            name: event.metadata.character_data.name,
            role: event.metadata.character_data.role,
            appearance: event.metadata.character_data.appearance,
            type: 'dynamic_npc'
          };
          
          console.log('🆕 检测到新角色创建:', newChar);
          setAllCharacters(prev => {
            // 智能去重：检查ID和名称
            if (prev.find(char => char.id === newChar.id || char.name === newChar.name)) {
              console.log(`⚠️ 角色已存在，跳过添加: ${newChar.name}`);
              return prev;
            }
            console.log(`✨ 添加新角色: ${newChar.name} (${newChar.role})`);
            return [...prev, newChar];
          });
        }
      });
      
      const unsubscribePlayer = realtimeManager.onPlayerEvent((event) => {
        console.log('🧠 收到玩家事件:', event);
        setRealtimeEvents(prev => [...prev, { ...event, type: 'player' }]);
        
        // 如果是认知失调事件，显示回响之室邀请
        if (event.event_type === 'cognitive_dissonance') {
          setChamberEventId(event.id);
          setChamberOpen(true);
        }
      });
      
      const unsubscribeCharacter = realtimeManager.onCharacterState((state) => {
        console.log('🤖 收到角色状态更新:', state);
        setInternalStates(prev => new Map(prev.set(state.character_id, {
          energy: state.energy,
          focus: state.focus,
          curiosity: state.curiosity,
          confidence: 70, // 默认值
          boredom: state.boredom,
          anxiety: state.anxiety || 0,
          suspicion: state.suspicion || 0,
          last_updated: state.last_updated,
          last_activity: state.last_updated,
          last_autonomous_action: state.last_updated
        })));
      });
      
      // 定期更新状态 - 降低更新频率减少INP
      const stateUpdateInterval = setInterval(() => {
        const worldState = worldEngine.getWorldState();
        setCharacters(Array.from(worldState.characters.values()));
        setInternalStates(new Map(worldState.internal_states));
        
        // 检查玩家信念更新
        const playerBelief = worldState.belief_systems.get('player');
        if (playerBelief) {
          setPlayerBeliefs(playerBelief);
        }
      }, 10000);
      
      return () => {
        unsubscribe();
        unsubscribeScene();
        unsubscribePlayer();
        unsubscribeCharacter();
        realtimeManager.cleanup();
        if (passiveObserverCleanup) {
          passiveObserverCleanup();
        }
        clearInterval(stateUpdateInterval);
        worldEngine.stopHeartbeat();
      };
    }
  }, [gameStarted, playerName]);

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  // 会话状态监控
  const startSessionMonitoring = (sessionId: string) => {
    console.log('⏱️ 开始会话状态监控:', sessionId);
    
    // 清除之前的定时器
    if (sessionMonitorRef.current) {
      clearInterval(sessionMonitorRef.current);
    }
    
    // 每5秒检查一次会话状态
    sessionMonitorRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/session-control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check',
            sessionId
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          setSessionStats({
            remainingTime: data.remainingTime,
            remainingCalls: data.remainingCalls,
            aiCallCount: data.currentStats.aiCallCount,
            totalCost: data.currentStats.totalCost,
            warning: data.warning,
            sessionActive: data.sessionActive
          });
          
          // 显示警告
          if (data.warning) {
            console.warn('⚠️ 会话警告:', data.warning);
            // 可以在这里添加 toast 通知
          }
          
          // 检查是否需要强制停止
          if (data.shouldStop && data.sessionActive) {
            console.log('🛑 会话已达到限制，强制停止');
            await stopSession();
          }
        }
      } catch (error) {
        console.error('会话状态检查失败:', error);
      }
    }, 5000); // 每5秒检查一次
  };

  // 停止会话
  const stopSession = async () => {
    try {
      if (sessionId) {
        await fetch('/api/session-control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'stop',
            sessionId
          })
        });
      }
      
      // 清理定时器
      if (sessionMonitorRef.current) {
        clearInterval(sessionMonitorRef.current);
        sessionMonitorRef.current = null;
      }
      
      // 停止世界引擎
      worldEngine.stopHeartbeat();
      
      // 重置游戏状态
      setGameStarted(false);
      setEvents([]);
      setSessionStats({
        remainingTime: 180000,
        remainingCalls: 300,
        aiCallCount: 0,
        totalCost: 0,
        warning: null,
        sessionActive: false
      });
      
      console.log('🏁 会话已结束');
    } catch (error) {
      console.error('停止会话失败:', error);
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (sessionMonitorRef.current) {
        clearInterval(sessionMonitorRef.current);
      }
    };
  }, []);

  // 开始游戏
  const startGame = async () => {
    console.log('🎮 [DEBUG] startGame被调用，playerName:', playerName);
    if (!playerName.trim()) return;
    
    setLoading(true);
    try {
      // 启动会话控制
      console.log('⏱️ 启动会话控制...');
      const sessionResponse = await fetch('/api/session-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start', 
          playerName 
        })
      });
      
      if (!sessionResponse.ok) {
        throw new Error('会话控制启动失败');
      }
      
      const sessionData = await sessionResponse.json();
      const newSessionId = sessionData.sessionId;
      setSessionId(newSessionId);
      console.log('⏱️ 会话控制启动成功:', newSessionId);
      
      // 通过API路由初始化游戏会话
      console.log('🔄 初始化游戏会话...');
      const initResponse = await fetch('/api/init-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, sessionId: newSessionId })
      });
      
      if (!initResponse.ok) {
        throw new Error('游戏初始化失败');
      }
      
      await initResponse.json();
      console.log('🔄 游戏会话初始化完成');
      
      // 添加玩家到世界
      worldEngine.addPlayer(playerName);
      
      // 启动会话状态监控
      startSessionMonitoring(newSessionId);
      
      console.log('🎯 [DEBUG] 即将设置gameStarted为true...');
      setGameStarted(true);
      console.log('🎯 [DEBUG] gameStarted已设置为true');
      
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
        type: inputMode,
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
        console.log('📨 API响应:', result);
        
        // 记录AI调用到会话控制
        await fetch('/api/session-control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'recordCall',
            sessionId: sessionId
          })
        });
        
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
      } else {
        // API请求失败
        const errorText = await response.text();
        console.error('❌ API请求失败:', response.status, errorText);
        
        const errorEvent = {
          id: `api_error_${Date.now()}`,
          type: 'system' as const,
          character_id: 'system',
          content: `API错误 (${response.status}): ${errorText.slice(0, 100)}...`,
          timestamp: Date.now(),
          scene_id: 'moonlight_tavern'
        };
        worldEngine.publishEvent(errorEvent);
      }
    } catch (error) {
      console.error('❌ 消息处理失败:', error);
      // 添加用户友好的错误提示
      const errorEvent = {
        id: `error_${Date.now()}`,
        type: 'system' as const,
        character_id: 'system',
        content: `网络错误: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
        scene_id: 'moonlight_tavern'
      };
      worldEngine.publishEvent(errorEvent);
    } finally {
      setSendingMessage(false);
    }
  };

  // 内容过滤：只显示玩家应该看到的内容
  const filterContentForPlayer = (event: GameEvent): { shouldShow: boolean; displayContent: string } => {
    // 完全隐藏的事件类型
    const hiddenEventTypes = ['thought', 'cognitive_dissonance'];
    if (hiddenEventTypes.includes(event.type)) {
      return { shouldShow: false, displayContent: '' };
    }

    // 过滤技术性内容
    let content = event.content;
    
    // 隐藏技术细节的关键词
    const techKeywords = [
      '无聊值', '能量', '专注', '好奇心', '焦虑', '怀疑',
      '状态更新', '心跳', '自主行为', '内在状态', '信念系统',
      'AI调用', 'API', '数据库', '触发', '检测到', '分析',
      '思考', '决策', '判断', '评估', '算法'
    ];
    
    // 如果内容包含技术关键词，过滤或隐藏
    const hasTechContent = techKeywords.some(keyword => content.includes(keyword));
    if (hasTechContent && event.character_id === 'system') {
      return { shouldShow: false, displayContent: '' };
    }
    
    // 修复自我指涉错误（如"陈浩观察陈浩"）
    if (event.character_id !== 'system' && event.character_id !== 'player') {
      const characterName = getCharacterDisplayName(event.character_id);
      // 检查是否包含自我指涉
      if (content.includes(`${characterName}观察${characterName}`) || 
          content.includes(`${characterName}看着${characterName}`)) {
        // 修复为合理的行为
        content = content.replace(
          new RegExp(`${characterName}观察${characterName}`, 'g'), 
          `${characterName}若有所思地环视四周`
        ).replace(
          new RegExp(`${characterName}看着${characterName}`, 'g'),
          `${characterName}陷入了沉思`
        );
      }
    }
    
    return { shouldShow: true, displayContent: content };
  };

  // 获取角色显示名称
  const getCharacterDisplayName = (characterId: string): string => {
    const char = allCharacters.find(c => c.id === characterId);
    return char ? char.name : characterId;
  };

  // 触发认知失调测试
  const triggerCognitiveDissonance = async () => {
    console.log('🧠 手动触发认知失调测试...');
    console.log('🎮 当前状态:', { gameStarted, playerName });
    
    // 检查游戏是否已开始
    if (!gameStarted || !playerName.trim()) {
      console.warn('⚠️ 游戏未开始或玩家名称为空');
      alert('请先输入玩家名称并开始游戏！');
      return;
    }
    
    try {
      const requestData = {
        playerId: 'player',
        playerName: playerName,
        triggerContext: '你在月影酒馆中的种种经历，让你感到内心深处某种微妙的冲突正在觉醒...',
        triggerType: 'test'
      };
      
      console.log('📤 发送请求:', requestData);
      
      const response = await fetch('/api/trigger-dissonance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('📥 API响应状态:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✨ 认知失调触发成功:', result);
        
        // 检查是否需要手动触发回响之室（作为备用）
        if (result.chamber_invitation) {
          console.log('🔮 准备打开回响之室...');
          // 延迟一下，让数据库事件先处理
          setTimeout(() => {
            setChamberOpen(true);
          }, 1000);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ 认知失调触发失败:', response.status, errorText);
        alert(`认知失调触发失败: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 认知失调触发异常:', error);
      alert(`网络错误: ${error instanceof Error ? error.message : '未知错误'}`);
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
    if (characterId === 'environment') return '🌍';
    
    // 万能AI角色
    const universalRole = universalAIRoles[characterId];
    if (universalRole) return universalRole.avatar;
    
    return '🎭';
  };

  // 获取角色名称
  const getCharacterName = (characterId: string) => {
    if (characterId === 'player') return playerName;
    if (characterId === 'linxi') return '林溪';
    if (characterId === 'chenhao') return '陈浩';
    if (characterId === 'system') return 'system';
    if (characterId === 'environment') return '环境';
    
    // 万能AI角色
    const universalRole = universalAIRoles[characterId];
    if (universalRole) return universalRole.name;
    
    // 检查是否是动态角色 - 显示"职能 昵称"
    const dynamicChar = dynamicCharacterManager.getCharacterById(characterId);
    if (dynamicChar) {
      console.log(`🎭 找到动态角色: ${characterId} -> ${dynamicChar.role} ${dynamicChar.name}`);
      // 始终显示"职能 昵称"的格式，如"酒保 李明"
      return `${dynamicChar.role} ${dynamicChar.name}`;
    } else {
      // 如果是动态角色ID但找不到角色数据，尝试从ID中提取信息
      if (characterId.startsWith('dynamic_')) {
        console.log(`🎭 未找到动态角色数据: ${characterId}`);
        // 显示一个默认名称，避免显示丑陋的ID
        return '临时角色';
      }
    }
    
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
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-cyan-400">📍 🌙 月影酒馆</h2>
                  
                  {/* 会话状态栏 */}
                  <div className="text-xs bg-gray-800/70 rounded-lg px-3 py-1 space-y-1">
                    <div className="text-yellow-400">
                      ⏱️ {Math.floor(sessionStats.remainingTime / 60000)}:{String(Math.floor((sessionStats.remainingTime % 60000) / 1000)).padStart(2, '0')}
                    </div>
                    <div className="text-blue-400">
                      🔄 {sessionStats.aiCallCount}/300
                    </div>
                    <div className="text-green-400">
                      💰 ${sessionStats.totalCost.toFixed(4)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm leading-relaxed">
                  {sceneDescription || '昏暗的灯光下，木质桌椅散发着岁月的痕迹。空气中弥漫着酒精和烟草的味道。'}
                </p>
                
                {/* 会话警告 */}
                {sessionStats.warning && (
                  <div className="mt-2 p-2 bg-yellow-900/50 border border-yellow-500/50 rounded text-yellow-300 text-sm">
                    {sessionStats.warning}
                  </div>
                )}
                {ambientActivity.length > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    <span className="text-yellow-400">🎭 周围环境：</span>
                    {ambientActivity.slice(0, 2).join('，')}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">世界状态 v2.0 🔧</div>
              <div className="text-green-400 text-sm">
                💓 心跳运行中 • {events.length} 个事件
              </div>
              <div className="text-blue-400 text-xs">
                📡 实时: {realtimeEvents.length} 个推送事件
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
            {/* 统一角色列表 */}
            {allCharacters.length > 0 && (
              <div className="bg-gray-800/70 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold text-cyan-400 mb-3">🎭 酒馆中的人物</h3>
                <div className="space-y-2">
                  {allCharacters.map(char => (
                    <div key={char.id} className="bg-gray-700/50 p-2 rounded-lg border border-gray-600/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getCharacterAvatar(char.id)}</span>
                          <div>
                            <div className="font-medium text-white text-sm">{char.name}</div>
                            <div className="text-xs text-gray-400">{char.role}</div>
                          </div>
                        </div>
                        <div className="text-xs text-right">
                          <div className={`px-2 py-1 rounded text-xs ${char.type === 'core_npc' ? 'bg-green-600/30 text-green-300' : 'bg-purple-600/30 text-purple-300'}`}>
                            {char.type === 'core_npc' ? '常驻' : '新客'}
                          </div>
                          {char.appearance && <div className="text-gray-400 mt-1">👤 {char.appearance}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            
            {/* 事件流 - 应用内容过滤 */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
              {events.slice(-50)
                .map(event => ({ ...event, ...filterContentForPlayer(event) }))
                .filter(event => event.shouldShow)
                .map((event, index) => (
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
                        {/* 移除自主标签以减少技术信息 */}
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed break-words">{event.displayContent}</p>
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
                  {/* 统一的角色对话按钮 */}
                  {allCharacters.map(char => (
                    <button
                      key={char.id}
                      onClick={() => setInputMessage(prev => prev + `@${char.name} `)}
                      className={`px-2 py-1 text-white rounded text-xs transition-colors ${
                        char.type === 'core_npc' 
                          ? char.id === 'linxi' 
                            ? 'bg-purple-600/50 hover:bg-purple-600' 
                            : 'bg-blue-600/50 hover:bg-blue-600'
                          : 'bg-green-600/50 hover:bg-green-600'
                      }`}
                      title={`与${char.name}对话 - ${char.role}`}
                    >
                      @{char.name}
                    </button>
                  ))}
                  
                  {/* 通用测试按钮 */}
                  <button
                    onClick={() => setInputMessage('有人吗？')}
                    className="px-2 py-1 bg-yellow-600/50 hover:bg-yellow-600 text-white rounded text-xs transition-colors"
                    title="测试智能AI系统"
                  >
                    💬测试
                  </button>
                  <button
                    onClick={triggerCognitiveDissonance}
                    className="px-2 py-1 bg-purple-600/50 hover:bg-purple-600 text-white rounded text-xs transition-colors"
                    title="触发认知失调，测试回响之室"
                  >
                    🧠失调
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
      
      {/* 回响之室组件 */}
      <ChamberOfEchoes
        isOpen={chamberOpen}
        playerId="player"
        playerName={playerName}
        triggerContext="你感到了某种内心的冲突和疑惑..."
        onClose={() => setChamberOpen(false)}
      />
    </div>
  );
}