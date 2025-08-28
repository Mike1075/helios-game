// SSE连接管理器 - 管理活跃的SSE连接和会话状态

interface SSEConnection {
  controller: ReadableStreamDefaultController
  encoder: TextEncoder
  userId: string
  sessionId: string
  createdAt: Date
  lastActivity: Date
}

interface ConsciousnessSession {
  sessionId: string
  userId: string
  message: string
  stages: {
    [stageName: string]: {
      status: 'pending' | 'processing' | 'completed' | 'error'
      content?: string
      timestamp?: Date
    }
  }
  createdAt: Date
  completedAt?: Date
}

class SSEManager {
  private connections = new Map<string, SSEConnection>()
  private sessions = new Map<string, ConsciousnessSession>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // 每30秒清理过期连接
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredConnections()
    }, 30000)
  }

  // 创建新的SSE连接
  createConnection(userId: string, sessionId: string): ReadableStream {
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start: (controller) => {
        // 存储连接信息
        this.connections.set(sessionId, {
          controller,
          encoder,
          userId,
          sessionId,
          createdAt: new Date(),
          lastActivity: new Date()
        })

        // 发送连接确认
        this.sendToConnection(sessionId, {
          type: 'connection',
          status: 'connected',
          sessionId,
          message: 'SSE连接已建立'
        })

        console.log(`SSE连接已建立: ${sessionId} (用户: ${userId})`)
      },
      cancel: () => {
        // 连接关闭时清理
        this.removeConnection(sessionId)
        console.log(`SSE连接已关闭: ${sessionId}`)
      }
    })

    return stream
  }

  // 创建意识转化会话
  createConsciousnessSession(sessionId: string, userId: string, message: string): ConsciousnessSession {
    const session: ConsciousnessSession = {
      sessionId,
      userId,
      message,
      stages: {
        belief: { status: 'pending' },
        drive: { status: 'pending' },
        collective: { status: 'pending' },
        behavior: { status: 'pending' },
        mind: { status: 'pending' },
        reaction: { status: 'pending' }
      },
      createdAt: new Date()
    }

    this.sessions.set(sessionId, session)
    console.log(`意识转化会话已创建: ${sessionId}`)
    return session
  }

  // 更新阶段状态
  updateStageStatus(
    sessionId: string, 
    stageName: string, 
    status: 'processing' | 'completed' | 'error',
    content?: string
  ) {
    const session = this.sessions.get(sessionId)
    if (!session) {
      console.error(`会话不存在: ${sessionId}`)
      return
    }

    // 更新阶段状态
    session.stages[stageName] = {
      status,
      content,
      timestamp: new Date()
    }

    // 计算进度
    const totalStages = Object.keys(session.stages).length
    const completedStages = Object.values(session.stages).filter(
      stage => stage.status === 'completed' || stage.status === 'error'
    ).length
    const progress = Math.round((completedStages / totalStages) * 100)

    // 发送更新到前端
    this.sendToConnection(sessionId, {
      type: 'stage_update',
      stage: stageName,
      status,
      content: content || `${this.getStageLabel(stageName)}${status === 'processing' ? '处理中...' : '已完成'}`,
      progress,
      timestamp: new Date().toISOString()
    })

    // 检查是否所有阶段都完成
    if (completedStages === totalStages) {
      this.completeSession(sessionId)
    }
  }

  // 完成会话
  private completeSession(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.completedAt = new Date()

    // 收集所有阶段的结果
    const results = Object.entries(session.stages)
      .filter(([_, stage]) => stage.status === 'completed' && stage.content)
      .map(([_, stage]) => stage.content)
      .join('\n\n')

    // 发送完成信号
    this.sendToConnection(sessionId, {
      type: 'session_complete',
      status: 'finished',
      content: results,
      progress: 100,
      sessionId,
      timestamp: new Date().toISOString()
    })

    console.log(`意识转化会话已完成: ${sessionId}`)
  }

  // 发送消息到指定连接
  sendToConnection(sessionId: string, data: any) {
    const connection = this.connections.get(sessionId)
    if (!connection) {
      console.error(`连接不存在: ${sessionId}`)
      return false
    }

    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      connection.controller.enqueue(connection.encoder.encode(message))
      connection.lastActivity = new Date()
      return true
    } catch (error) {
      console.error(`发送SSE消息失败: ${sessionId}`, error)
      this.removeConnection(sessionId)
      return false
    }
  }

  // 移除连接
  removeConnection(sessionId: string) {
    const connection = this.connections.get(sessionId)
    if (connection) {
      try {
        connection.controller.close()
      } catch (error) {
        // 忽略关闭错误
      }
      this.connections.delete(sessionId)
    }
  }

  // 获取会话信息
  getSession(sessionId: string): ConsciousnessSession | undefined {
    return this.sessions.get(sessionId)
  }

  // 获取连接信息
  getConnection(sessionId: string): SSEConnection | undefined {
    return this.connections.get(sessionId)
  }

  // 清理过期连接
  private cleanupExpiredConnections() {
    const now = new Date()
    const expiredConnections: string[] = []

    this.connections.forEach((connection, sessionId) => {
      // 10分钟无活动则视为过期
      const inactiveTime = now.getTime() - connection.lastActivity.getTime()
      if (inactiveTime > 10 * 60 * 1000) {
        expiredConnections.push(sessionId)
      }
    })

    expiredConnections.forEach(sessionId => {
      console.log(`清理过期SSE连接: ${sessionId}`)
      this.removeConnection(sessionId)
      this.sessions.delete(sessionId)
    })
  }

  // 获取阶段中文标签
  private getStageLabel(stage: string): string {
    const labels: {[key: string]: string} = {
      'belief': '信念系统',
      'drive': '内驱力',
      'collective': '集体潜意识',
      'behavior': '外我行为',
      'mind': '头脑解释',
      'reaction': '外我反应'
    }
    return labels[stage] || stage
  }

  // 获取统计信息
  getStats() {
    return {
      activeConnections: this.connections.size,
      activeSessions: this.sessions.size,
      connections: Array.from(this.connections.values()).map(conn => ({
        sessionId: conn.sessionId,
        userId: conn.userId,
        createdAt: conn.createdAt,
        lastActivity: conn.lastActivity
      }))
    }
  }

  // 清理资源
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    
    // 关闭所有连接
    this.connections.forEach((_, sessionId) => {
      this.removeConnection(sessionId)
    })
    
    this.connections.clear()
    this.sessions.clear()
  }
}

// 全局SSE管理器实例
export const sseManager = new SSEManager()

// 生成会话ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
