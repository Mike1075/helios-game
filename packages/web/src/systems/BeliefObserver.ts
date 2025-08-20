/**
 * 信念观察者系统
 * 
 * Mike项目的核心创新：从玩家行为中动态发现和生成信念档案
 * 这是"本我之镜"理念的技术实现
 */

import { BeliefSystem, BeliefItem, GameEvent, Character } from '../types/core';

// ===========================================
// 行为分析类型
// ===========================================

/**
 * 行为模式分析结果
 */
interface BehaviorPattern {
  pattern_type: 'communication' | 'decision' | 'social' | 'emotional';
  pattern_description: string;
  frequency: number; // 出现频率
  confidence: number; // 置信度 (0-1)
  supporting_events: string[]; // 支持事件ID
}

/**
 * 信念推断结果
 */
interface BeliefInference {
  belief_category: 'worldview' | 'selfview' | 'values';
  belief_description: string;
  strength: number; // 信念强度 (0-1)
  evidence_quality: number; // 证据质量 (0-1)
  source_patterns: string[]; // 来源行为模式
}

// ===========================================
// 信念观察者主类
// ===========================================

export class BeliefObserver {
  private behaviorHistory: Map<string, GameEvent[]> = new Map();
  private beliefSystems: Map<string, BeliefSystem> = new Map();
  private analysisCache: Map<string, BehaviorPattern[]> = new Map();

  constructor() {
    console.log('🔮 信念观察者系统启动 - 开始观察行为模式...');
  }

  /**
   * 记录行为事件
   */
  recordBehavior(characterId: string, event: GameEvent): void {
    if (!this.behaviorHistory.has(characterId)) {
      this.behaviorHistory.set(characterId, []);
    }
    
    const history = this.behaviorHistory.get(characterId)!;
    history.push(event);
    
    // 限制历史长度，保持最近100个事件
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    // 清理分析缓存
    this.analysisCache.delete(characterId);
    
    console.log(`📝 记录行为: ${characterId} - ${event.type}: "${event.content}"`);
  }

  /**
   * 分析角色的行为模式
   */
  analyzeBehaviorPatterns(characterId: string): BehaviorPattern[] {
    // 检查缓存
    if (this.analysisCache.has(characterId)) {
      return this.analysisCache.get(characterId)!;
    }
    
    const history = this.behaviorHistory.get(characterId) || [];
    if (history.length < 3) {
      return []; // 行为太少，无法分析
    }
    
    const patterns: BehaviorPattern[] = [];
    
    // 分析沟通模式
    patterns.push(...this.analyzeCommunicationPatterns(history));
    
    // 分析决策模式
    patterns.push(...this.analyzeDecisionPatterns(history));
    
    // 分析社交模式
    patterns.push(...this.analyzeSocialPatterns(history));
    
    // 分析情绪模式
    patterns.push(...this.analyzeEmotionalPatterns(history));
    
    // 缓存结果
    this.analysisCache.set(characterId, patterns);
    
    console.log(`🧠 分析完成: ${characterId} 发现 ${patterns.length} 个行为模式`);
    return patterns;
  }

  /**
   * 生成信念系统
   */
  async generateBeliefSystem(characterId: string): Promise<BeliefSystem | null> {
    const patterns = this.analyzeBehaviorPatterns(characterId);
    if (patterns.length === 0) {
      return null;
    }
    
    console.log(`🔮 开始为 ${characterId} 生成信念系统...`);
    
    // 推断信念
    const inferences = this.inferBeliefsFromPatterns(patterns);
    
    // 构建信念系统
    const beliefSystem: BeliefSystem = {
      character_id: characterId,
      worldview: inferences.filter(i => i.belief_category === 'worldview').map(this.convertToBeliefItem),
      selfview: inferences.filter(i => i.belief_category === 'selfview').map(this.convertToBeliefItem),
      values: inferences.filter(i => i.belief_category === 'values').map(this.convertToBeliefItem),
      last_updated: Date.now(),
      based_on_logs_count: this.behaviorHistory.get(characterId)?.length || 0,
      confidence_score: this.calculateOverallConfidence(inferences)
    };
    
    // 使用Mike的API进行AI增强分析
    const enhancedBelief = await this.enhanceWithAI(characterId, beliefSystem, patterns);
    
    // 缓存结果
    this.beliefSystems.set(characterId, enhancedBelief);
    
    console.log(`✨ 信念系统生成完成: ${characterId}`);
    console.log(`- 世界观: ${enhancedBelief.worldview.length}条`);
    console.log(`- 自我认知: ${enhancedBelief.selfview.length}条`);
    console.log(`- 价值观: ${enhancedBelief.values.length}条`);
    
    return enhancedBelief;
  }

  /**
   * 获取角色的当前信念系统
   */
  getBeliefSystem(characterId: string): BeliefSystem | null {
    return this.beliefSystems.get(characterId) || null;
  }

  /**
   * 检查是否需要更新信念系统
   */
  shouldUpdateBeliefSystem(characterId: string): boolean {
    const history = this.behaviorHistory.get(characterId);
    const beliefSystem = this.beliefSystems.get(characterId);
    
    if (!history || history.length < 5) {
      return false; // 行为太少
    }
    
    if (!beliefSystem) {
      return true; // 还没有信念系统
    }
    
    // 如果新行为数量显著增加，需要更新
    const newBehaviorCount = history.length - beliefSystem.based_on_logs_count;
    return newBehaviorCount >= 5;
  }

  // ===========================================
  // 私有分析方法
  // ===========================================

  /**
   * 分析沟通模式
   */
  private analyzeCommunicationPatterns(history: GameEvent[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const dialogues = history.filter(e => e.type === 'dialogue');
    
    if (dialogues.length === 0) return patterns;
    
    // 分析对话长度倾向
    const avgLength = dialogues.reduce((sum, d) => sum + d.content.length, 0) / dialogues.length;
    
    if (avgLength > 50) {
      patterns.push({
        pattern_type: 'communication',
        pattern_description: '倾向于详细表达，喜欢完整地表达想法',
        frequency: dialogues.length / history.length,
        confidence: 0.8,
        supporting_events: dialogues.slice(0, 3).map(e => e.id)
      });
    } else {
      patterns.push({
        pattern_type: 'communication',
        pattern_description: '倾向于简洁表达，不喜欢长篇大论',
        frequency: dialogues.length / history.length,
        confidence: 0.7,
        supporting_events: dialogues.slice(0, 3).map(e => e.id)
      });
    }
    
    // 分析问号使用（好奇心）
    const questionCount = dialogues.filter(d => d.content.includes('?') || d.content.includes('？')).length;
    if (questionCount > dialogues.length * 0.3) {
      patterns.push({
        pattern_type: 'communication',
        pattern_description: '经常提问，对事物保持好奇心',
        frequency: questionCount / dialogues.length,
        confidence: 0.9,
        supporting_events: dialogues.filter(d => d.content.includes('?') || d.content.includes('？')).slice(0, 3).map(e => e.id)
      });
    }
    
    return patterns;
  }

  /**
   * 分析决策模式
   */
  private analyzeDecisionPatterns(history: GameEvent[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const actions = history.filter(e => e.type === 'action');
    
    if (actions.length === 0) return patterns;
    
    // 分析主动性
    const proactiveActions = actions.filter(a => 
      a.content.includes('主动') || 
      a.content.includes('走向') || 
      a.content.includes('询问')
    );
    
    if (proactiveActions.length > actions.length * 0.4) {
      patterns.push({
        pattern_type: 'decision',
        pattern_description: '性格主动，喜欢主动出击而不是被动等待',
        frequency: proactiveActions.length / actions.length,
        confidence: 0.8,
        supporting_events: proactiveActions.slice(0, 3).map(e => e.id)
      });
    }
    
    return patterns;
  }

  /**
   * 分析社交模式
   */
  private analyzeSocialPatterns(history: GameEvent[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    
    // 分析@其他人的频率
    const mentionEvents = history.filter(e => e.content.includes('@'));
    if (mentionEvents.length > 0) {
      patterns.push({
        pattern_type: 'social',
        pattern_description: '善于直接沟通，会主动提及特定的人',
        frequency: mentionEvents.length / history.length,
        confidence: 0.7,
        supporting_events: mentionEvents.slice(0, 3).map(e => e.id)
      });
    }
    
    return patterns;
  }

  /**
   * 分析情绪模式
   */
  private analyzeEmotionalPatterns(history: GameEvent[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    
    // 分析情绪词汇使用
    const emotionalWords = ['生气', '高兴', '担心', '兴奋', '害怕', '好奇', '失望'];
    const emotionalEvents = history.filter(e => 
      emotionalWords.some(word => e.content.includes(word))
    );
    
    if (emotionalEvents.length > history.length * 0.2) {
      patterns.push({
        pattern_type: 'emotional',
        pattern_description: '情感表达丰富，不隐藏自己的情绪',
        frequency: emotionalEvents.length / history.length,
        confidence: 0.8,
        supporting_events: emotionalEvents.slice(0, 3).map(e => e.id)
      });
    }
    
    return patterns;
  }

  /**
   * 从行为模式推断信念
   */
  private inferBeliefsFromPatterns(patterns: BehaviorPattern[]): BeliefInference[] {
    const inferences: BeliefInference[] = [];
    
    patterns.forEach(pattern => {
      switch (pattern.pattern_description) {
        case '倾向于详细表达，喜欢完整地表达想法':
          inferences.push({
            belief_category: 'values',
            belief_description: '认为清晰和完整的沟通很重要',
            strength: pattern.confidence * 0.8,
            evidence_quality: pattern.frequency,
            source_patterns: [pattern.pattern_description]
          });
          break;
          
        case '经常提问，对事物保持好奇心':
          inferences.push({
            belief_category: 'worldview',
            belief_description: '相信通过提问可以更好地理解世界',
            strength: pattern.confidence * 0.9,
            evidence_quality: pattern.frequency,
            source_patterns: [pattern.pattern_description]
          });
          inferences.push({
            belief_category: 'selfview',
            belief_description: '我是一个有好奇心的人',
            strength: pattern.confidence * 0.7,
            evidence_quality: pattern.frequency,
            source_patterns: [pattern.pattern_description]
          });
          break;
          
        case '性格主动，喜欢主动出击而不是被动等待':
          inferences.push({
            belief_category: 'selfview',
            belief_description: '我喜欢掌控局面，不喜欢被动等待',
            strength: pattern.confidence * 0.8,
            evidence_quality: pattern.frequency,
            source_patterns: [pattern.pattern_description]
          });
          inferences.push({
            belief_category: 'values',
            belief_description: '主动行动比被动等待更有价值',
            strength: pattern.confidence * 0.7,
            evidence_quality: pattern.frequency,
            source_patterns: [pattern.pattern_description]
          });
          break;
          
        case '善于直接沟通，会主动提及特定的人':
          inferences.push({
            belief_category: 'values',
            belief_description: '直接沟通比拐弯抹角更有效',
            strength: pattern.confidence * 0.8,
            evidence_quality: pattern.frequency,
            source_patterns: [pattern.pattern_description]
          });
          break;
          
        case '情感表达丰富，不隐藏自己的情绪':
          inferences.push({
            belief_category: 'selfview',
            belief_description: '我是一个情感真实的人，不会隐藏情绪',
            strength: pattern.confidence * 0.8,
            evidence_quality: pattern.frequency,
            source_patterns: [pattern.pattern_description]
          });
          inferences.push({
            belief_category: 'values',
            belief_description: '真实表达情感比装作冷静更重要',
            strength: pattern.confidence * 0.7,
            evidence_quality: pattern.frequency,
            source_patterns: [pattern.pattern_description]
          });
          break;
      }
    });
    
    return inferences;
  }

  /**
   * 转换为信念项
   */
  private convertToBeliefItem = (inference: BeliefInference): BeliefItem => ({
    description: inference.belief_description,
    weight: inference.strength,
    evidence_count: Math.floor(inference.evidence_quality * 10),
    last_updated: Date.now()
  });

  /**
   * 计算整体置信度
   */
  private calculateOverallConfidence(inferences: BeliefInference[]): number {
    if (inferences.length === 0) return 0;
    
    const avgStrength = inferences.reduce((sum, inf) => sum + inf.strength, 0) / inferences.length;
    const avgQuality = inferences.reduce((sum, inf) => sum + inf.evidence_quality, 0) / inferences.length;
    
    return (avgStrength + avgQuality) / 2;
  }

  /**
   * 使用Mike的AI API增强信念分析
   */
  private async enhanceWithAI(
    characterId: string, 
    basicBelief: BeliefSystem, 
    patterns: BehaviorPattern[]
  ): Promise<BeliefSystem> {
    try {
      console.log(`🤖 调用AI增强信念分析: ${characterId}`);
      
      // 构建AI分析提示
      const analysisPrompt = this.buildAIAnalysisPrompt(characterId, basicBelief, patterns);
      
      // 调用Mike的chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: analysisPrompt,
          playerName: 'BeliefObserver',
          chatHistory: '',
          inputType: 'analysis'
        })
      });
      
      if (!response.ok) {
        throw new Error(`AI API调用失败: ${response.status}`);
      }
      
      const aiResult = await response.json();
      
      // 解析AI的增强建议并整合
      return this.integrateAIEnhancements(basicBelief, aiResult);
      
    } catch (error) {
      console.warn(`⚠️ AI增强失败，使用基础分析: ${error}`);
      return basicBelief;
    }
  }

  /**
   * 构建AI分析提示
   */
  private buildAIAnalysisPrompt(
    characterId: string, 
    basicBelief: BeliefSystem, 
    patterns: BehaviorPattern[]
  ): string {
    return `作为心理分析专家，请分析以下角色的信念系统：

角色ID: ${characterId}
观察到的行为模式:
${patterns.map(p => `- ${p.pattern_description} (置信度: ${p.confidence})`).join('\n')}

当前推断的信念:
世界观: ${basicBelief.worldview.map(b => b.description).join('; ')}
自我认知: ${basicBelief.selfview.map(b => b.description).join('; ')}
价值观: ${basicBelief.values.map(b => b.description).join('; ')}

请提供更深入的心理分析，发现可能遗漏的信念模式。`;
  }

  /**
   * 整合AI增强建议
   */
  private integrateAIEnhancements(basicBelief: BeliefSystem, aiResult: any): BeliefSystem {
    // 暂时返回基础信念系统
    // 在实际实现中，这里会解析AI的响应并整合新的信念洞察
    return basicBelief;
  }
}

// ===========================================
// 导出单例
// ===========================================

export const beliefObserver = new BeliefObserver();