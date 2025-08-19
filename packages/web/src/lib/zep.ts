/**
 * Zep记忆系统集成
 * 管理对话历史和角色记忆
 */

// Zep相关类型定义
export interface ZepMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    character_id?: string;
    player_name?: string;
    timestamp?: number;
    emotion?: string;
    input_type?: string;
  };
}

export interface ZepSession {
  session_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

/**
 * Zep API客户端类
 */
class ZepClient {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.ZEP_API_KEY!;
    this.endpoint = process.env.ZEP_ENDPOINT || 'https://api.getzep.com';
  }

  private async makeRequest(path: string, options: RequestInit = {}) {
    const url = `${this.endpoint}${path}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Api-Key': this.apiKey,  // v3使用Api-Key而不是Bearer
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Zep API详细错误: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Zep API错误: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 创建新的对话会话（v3中是thread）
   */
  async createSession(sessionId: string, userId: string, metadata?: any) {
    try {
      // v3: 先创建用户（如果不存在）
      await this.makeRequest('/api/v3/users', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          metadata: metadata || {}
        }),
      }).catch(() => {
        // 用户可能已存在，忽略错误
      });

      // v3: 创建thread
      return await this.makeRequest('/api/v3/threads', {
        method: 'POST',
        body: JSON.stringify({
          thread_id: sessionId,
          user_id: userId,
          metadata: metadata || {}
        }),
      });
    } catch (error) {
      console.error('创建Zep会话失败:', error);
      return null;
    }
  }

  /**
   * 添加消息到会话（v3中是thread）
   */
  async addMessage(sessionId: string, message: ZepMessage) {
    try {
      // v3: 使用新的消息格式
      const v3Message = {
        name: message.metadata?.character_id === 'player' 
          ? message.metadata?.player_name || 'Player'
          : message.metadata?.character_id || 'Assistant',
        content: message.content,
        role: message.role,
        metadata: message.metadata
      };

      return await this.makeRequest(`/api/v3/threads/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          messages: [v3Message]
        }),
      });
    } catch (error) {
      console.error('添加Zep消息失败:', error);
      return null;
    }
  }

  /**
   * 获取会话的对话历史（v3中是thread）
   */
  async getSessionHistory(sessionId: string, limit = 10) {
    try {
      const response = await this.makeRequest(`/api/v3/threads/${sessionId}/messages?limit=${limit}`);
      return response.messages || [];
    } catch (error) {
      console.error('获取Zep历史失败:', error);
      return [];
    }
  }

  /**
   * 获取会话的记忆摘要（v3中是user context）
   */
  async getSessionSummary(sessionId: string) {
    try {
      const response = await this.makeRequest(`/api/v3/threads/${sessionId}/context?mode=summary`);
      return response.summary || response.content || '';
    } catch (error) {
      console.error('获取Zep摘要失败:', error);
      return '';
    }
  }

  /**
   * 搜索相关记忆（v3可能不直接支持，暂时禁用）
   */
  async searchMemory(sessionId: string, query: string, limit = 5) {
    try {
      console.warn('Zep v3暂不支持直接搜索，返回空结果');
      return [];
    } catch (error) {
      console.error('搜索Zep记忆失败:', error);
      return [];
    }
  }
}

// 全局Zep客户端实例
export const zepClient = new ZepClient();

/**
 * 获取玩家的会话ID
 */
export function getPlayerSessionId(playerName: string): string {
  return `player_${playerName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-6)}`;
}

/**
 * 格式化对话历史为字符串
 */
export function formatChatHistory(messages: ZepMessage[]): string {
  if (!messages || messages.length === 0) {
    return '对话刚刚开始...';
  }

  return messages
    .slice(-10) // 只取最近10条消息
    .map(msg => {
      const speaker = msg.metadata?.character_id === 'player' 
        ? msg.metadata?.player_name || '玩家'
        : msg.metadata?.character_id === 'linxi' 
          ? '林溪' 
          : msg.metadata?.character_id === 'chenhao'
            ? '陈浩'
            : '未知';
      
      return `${speaker}: ${msg.content}`;
    })
    .join('\n');
}

/**
 * 保存玩家消息到Zep
 */
export async function savePlayerMessage(
  sessionId: string, 
  playerName: string, 
  message: string, 
  inputType: 'dialogue' | 'action' = 'dialogue'
) {
  const zepMessage: ZepMessage = {
    role: 'user',
    content: message,
    metadata: {
      character_id: 'player',
      player_name: playerName,
      timestamp: Date.now(),
    }
  };

  return await zepClient.addMessage(sessionId, zepMessage);
}

/**
 * 保存AI角色响应到Zep
 */
export async function saveAIResponse(
  sessionId: string,
  characterId: string,
  dialogue: string,
  action?: string,
  emotion?: string
) {
  const content = action ? `${dialogue}\n[${action}]` : dialogue;
  
  const zepMessage: ZepMessage = {
    role: 'assistant',
    content: content,
    metadata: {
      character_id: characterId,
      timestamp: Date.now(),
      emotion: emotion
    }
  };

  return await zepClient.addMessage(sessionId, zepMessage);
}

/**
 * 获取对话历史
 */
export async function getChatHistory(sessionId: string, limit = 10): Promise<string> {
  try {
    const messages = await zepClient.getSessionHistory(sessionId, limit);
    return formatChatHistory(messages);
  } catch (error) {
    console.error('获取对话历史失败:', error);
    return '对话刚刚开始...';
  }
}

/**
 * 初始化玩家会话（v3中是thread）
 */
export async function initializePlayerSession(playerName: string): Promise<string> {
  const sessionId = getPlayerSessionId(playerName);
  
  try {
    await zepClient.createSession(sessionId, playerName, {
      game: 'helios-mirror-of-self',
      scene: 'moonlight-tavern',
      created_at: new Date().toISOString()
    });

    console.log('✅ Zep v3 Thread创建成功:', sessionId);
    return sessionId;
  } catch (error) {
    console.error('❌ Zep v3 Thread创建失败:', error);
    // 即使Zep失败，也返回sessionId用于本地存储
    return sessionId;
  }
}