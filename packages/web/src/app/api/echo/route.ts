import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { player_id, event_id, current_beliefs } = await request.json();
    
    console.log('🪞 回响之室请求:', { player_id, event_id });

    // 检查环境变量
    const hasAIKey = !!process.env.VERCEL_AI_GATEWAY_API_KEY;
    const hasAIUrl = !!process.env.VERCEL_AI_GATEWAY_URL;

    if (!hasAIKey || !hasAIUrl) {
      console.error('❌ 回响之室: AI Gateway环境变量缺失');
      return NextResponse.json(
        { 
          success: false,
          error: '回响之室暂时无法访问 - AI服务未配置'
        },
        { status: 500 }
      );
    }

    // 生成回响之室内容
    const systemPrompt = `你是回响之室的意识分析师，专门为玩家提供基于其信念系统的主观归因解释。

玩家信念系统：
${current_beliefs ? JSON.stringify(current_beliefs, null, 2) : '信念系统正在构建中...'}

任务：为玩家最近遇到的认知失调事件生成一个深度的、第一人称的主观解释。

返回JSON格式：
{
  "attribution": "基于玩家信念的第一人称主观归因解释（2-3句话）",
  "evidence": ["支持这种解释的记忆片段1", "支持这种解释的记忆片段2"],
  "insight": "深层的哲学洞察（1句话）",
  "generated_at": ${Date.now()}
}

要求：
- 归因要体现玩家的价值观和世界观
- 使用第一人称"我"的视角
- 语调要深思熟虑、内省的
- 避免过于消极，要有建设性的反思`;

    const userPrompt = `请为玩家ID: ${player_id} 的事件ID: ${event_id} 生成回响之室内容。这个玩家刚刚经历了一些可能的认知失调。`;

    console.log('🤖 生成回响之室内容...');
    const aiResponse = await aiService.generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    // 解析AI响应
    const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI响应格式错误');
    }

    const echoContent = JSON.parse(jsonMatch[0]);
    console.log('✨ 回响之室内容生成成功');

    return NextResponse.json({
      success: true,
      echo_content: echoContent
    });

  } catch (error) {
    console.error('❌ 回响之室生成失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `回响之室生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      },
      { status: 500 }
    );
  }
}