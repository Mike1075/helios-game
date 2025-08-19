import { NextApiRequest, NextApiResponse } from 'next'

// 从chat.ts导入玩家数据存储（在实际项目中，这应该是一个共享模块）
// 这里我们暂时重新定义，后续可以重构为共享模块
const player_data_store: Record<string, {
  beliefs: {
    worldview: string
    selfview: string
    values: string[]
    rules: string[]
  }
  message_history: Array<{
    role: 'user' | 'assistant'
    content: string
    character_name?: string
    timestamp: string
  }>
}> = {}

interface PlayerBeliefsRequest {
  player_id: string
  action?: 'get' | 'update' | 'reset'
  beliefs?: {
    worldview?: string
    selfview?: string
    values?: string[]
    rules?: string[]
  }
}

interface PlayerBeliefsResponse {
  success: boolean
  player_id: string
  beliefs: {
    worldview: string
    selfview: string
    values: string[]
    rules: string[]
  }
  message_history_count: number
  last_interaction?: string
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlayerBeliefsResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { player_id, action = 'get', beliefs }: PlayerBeliefsRequest = req.body

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' })
    }

    // 如果玩家不存在，返回错误
    if (!player_data_store[player_id]) {
      return res.status(404).json({ error: 'Player not found' })
    }

    const playerData = player_data_store[player_id]

    switch (action) {
      case 'get':
        // 获取玩家信念状态
        return res.status(200).json({
          success: true,
          player_id,
          beliefs: playerData.beliefs,
          message_history_count: playerData.message_history.length,
          last_interaction: playerData.message_history.length > 0 
            ? playerData.message_history[playerData.message_history.length - 1].timestamp 
            : undefined,
          message: '玩家信念状态获取成功'
        })

      case 'update':
        // 更新玩家信念
        if (beliefs) {
          if (beliefs.worldview) playerData.beliefs.worldview = beliefs.worldview
          if (beliefs.selfview) playerData.beliefs.selfview = beliefs.selfview
          if (beliefs.values) playerData.beliefs.values = beliefs.values
          if (beliefs.rules) playerData.beliefs.rules = beliefs.rules
          
          console.log(`玩家 ${player_id} 的信念已更新`)
        }
        
        return res.status(200).json({
          success: true,
          player_id,
          beliefs: playerData.beliefs,
          message_history_count: playerData.message_history.length,
          message: '玩家信念更新成功'
        })

      case 'reset':
        // 重置玩家信念到初始状态
        playerData.beliefs = {
          worldview: "世界是未知的，充满可能性",
          selfview: "我是一个探索者",
          values: ["探索未知", "寻找真相", "成长学习"],
          rules: ["保持好奇心", "尊重他人", "勇敢面对挑战"]
        }
        
        console.log(`玩家 ${player_id} 的信念已重置`)
        
        return res.status(200).json({
          success: true,
          player_id,
          beliefs: playerData.beliefs,
          message_history_count: playerData.message_history.length,
          message: '玩家信念重置成功'
        })

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }

  } catch (error) {
    console.error('Player beliefs API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
