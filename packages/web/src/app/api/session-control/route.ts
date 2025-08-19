import { NextRequest, NextResponse } from 'next/server';

// 会话状态存储（生产环境应使用数据库）
const sessionStates = new Map<string, SessionState>();

interface SessionState {
  sessionId: string;
  startTime: number;
  aiCallCount: number;
  totalCost: number;
  isActive: boolean;
  playerName: string;
  warningsShown: string[];
}

interface TestingLimits {
  maxSessionDuration: number;      // 3分钟 = 180000ms
  maxAiCallsPerSession: number;    // 300次调用
  budgetPerSession: number;        // $0.1预算
  costPerCall: number;             // 大约$0.0003每次调用
  warningAt80Percent: boolean;
  shutdownAt100Percent: boolean;
}

const LIMITS: TestingLimits = {
  maxSessionDuration: 180000,      // 3分钟
  maxAiCallsPerSession: 300,       // 300次调用
  budgetPerSession: 0.1,           // $0.1
  costPerCall: 0.0003,             // 通义千问成本
  warningAt80Percent: true,
  shutdownAt100Percent: true
};

/**
 * 开始新的测试会话
 */
export async function POST(request: NextRequest) {
  try {
    const { action, sessionId, playerName } = await request.json();
    
    if (action === 'start') {
      const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const sessionState: SessionState = {
        sessionId: newSessionId,
        startTime: Date.now(),
        aiCallCount: 0,
        totalCost: 0,
        isActive: true,
        playerName: playerName || 'Player',
        warningsShown: []
      };
      
      sessionStates.set(newSessionId, sessionState);
      
      console.log(`🎮 开始新测试会话: ${newSessionId} - 玩家: ${playerName}`);
      console.log(`⏱️ 限制: ${LIMITS.maxSessionDuration/1000}秒, ${LIMITS.maxAiCallsPerSession}次调用, $${LIMITS.budgetPerSession}`);
      
      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
        limits: LIMITS,
        message: `测试会话开始 - 限制：${LIMITS.maxSessionDuration/1000}秒，${LIMITS.maxAiCallsPerSession}次AI调用`
      });
    }
    
    if (action === 'check') {
      const session = sessionStates.get(sessionId);
      if (!session) {
        return NextResponse.json({
          success: false,
          error: '会话不存在'
        });
      }
      
      const now = Date.now();
      const elapsed = now - session.startTime;
      const remainingTime = Math.max(0, LIMITS.maxSessionDuration - elapsed);
      const remainingCalls = Math.max(0, LIMITS.maxAiCallsPerSession - session.aiCallCount);
      const remainingBudget = Math.max(0, LIMITS.budgetPerSession - session.totalCost);
      
      // 检查是否需要停止
      const shouldStop = 
        elapsed >= LIMITS.maxSessionDuration ||
        session.aiCallCount >= LIMITS.maxAiCallsPerSession ||
        session.totalCost >= LIMITS.budgetPerSession;
        
      if (shouldStop && session.isActive) {
        session.isActive = false;
        console.log(`🛑 会话 ${sessionId} 已到达限制，自动停止`);
      }
      
      // 检查是否需要显示警告
      const timeProgress = elapsed / LIMITS.maxSessionDuration;
      const callProgress = session.aiCallCount / LIMITS.maxAiCallsPerSession;
      const costProgress = session.totalCost / LIMITS.budgetPerSession;
      const maxProgress = Math.max(timeProgress, callProgress, costProgress);
      
      let warning = null;
      if (maxProgress >= 0.9 && !session.warningsShown.includes('90%')) {
        warning = '⚠️ 测试会话即将结束（90%）';
        session.warningsShown.push('90%');
      } else if (maxProgress >= 0.8 && !session.warningsShown.includes('80%')) {
        warning = '⚠️ 测试会话进度已达80%';
        session.warningsShown.push('80%');
      }
      
      return NextResponse.json({
        success: true,
        sessionActive: session.isActive,
        elapsed,
        remainingTime,
        remainingCalls,
        remainingBudget: parseFloat(remainingBudget.toFixed(4)),
        currentStats: {
          aiCallCount: session.aiCallCount,
          totalCost: parseFloat(session.totalCost.toFixed(4)),
          timeUsed: elapsed
        },
        progress: {
          time: Math.round(timeProgress * 100),
          calls: Math.round(callProgress * 100),
          cost: Math.round(costProgress * 100)
        },
        warning,
        shouldStop
      });
    }
    
    if (action === 'recordCall') {
      const session = sessionStates.get(sessionId);
      if (!session) {
        return NextResponse.json({
          success: false,
          error: '会话不存在'
        });
      }
      
      if (!session.isActive) {
        return NextResponse.json({
          success: false,
          error: '会话已结束'
        });
      }
      
      session.aiCallCount += 1;
      session.totalCost += LIMITS.costPerCall;
      
      console.log(`📞 记录AI调用 ${sessionId}: ${session.aiCallCount}/${LIMITS.maxAiCallsPerSession} 次，成本 $${session.totalCost.toFixed(4)}`);
      
      return NextResponse.json({
        success: true,
        aiCallCount: session.aiCallCount,
        totalCost: parseFloat(session.totalCost.toFixed(4))
      });
    }
    
    if (action === 'stop') {
      const session = sessionStates.get(sessionId);
      if (session) {
        session.isActive = false;
        
        const finalStats = {
          duration: Date.now() - session.startTime,
          aiCallCount: session.aiCallCount,
          totalCost: session.totalCost,
          playerName: session.playerName
        };
        
        console.log(`🏁 会话结束 ${sessionId}:`, finalStats);
        
        // 清理会话数据
        sessionStates.delete(sessionId);
        
        return NextResponse.json({
          success: true,
          message: '会话已结束',
          finalStats
        });
      }
      
      return NextResponse.json({
        success: false,
        error: '会话不存在'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '无效的动作'
    });
    
  } catch (error) {
    console.error('❌ 会话控制错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: `会话控制失败: ${error instanceof Error ? error.message : '未知错误'}`
      },
      { status: 500 }
    );
  }
}

/**
 * 获取活跃会话列表
 */
export async function GET(request: NextRequest) {
  const activeSessions = Array.from(sessionStates.values())
    .filter(session => session.isActive)
    .map(session => ({
      sessionId: session.sessionId,
      playerName: session.playerName,
      startTime: session.startTime,
      elapsed: Date.now() - session.startTime,
      aiCallCount: session.aiCallCount,
      totalCost: parseFloat(session.totalCost.toFixed(4))
    }));
    
  return NextResponse.json({
    success: true,
    activeSessions,
    limits: LIMITS,
    totalActiveSessions: activeSessions.length
  });
}