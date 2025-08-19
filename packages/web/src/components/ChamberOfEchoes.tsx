/**
 * 回响之室组件
 * 
 * 当检测到认知失调时，为玩家提供深度自省体验
 * 基于其信念系统生成主观归因解释
 */

'use client';

import { useState } from 'react';

interface EchoContent {
  subjective_explanation: string;
  supporting_memories: string[];
  belief_connection: string;
  emotional_resonance: string;
  wisdom_insight: string;
  action_suggestions: string[];
  generated_at: number;
  belief_alignment_score: number;
}

interface ChamberOfEchoesProps {
  isOpen: boolean;
  playerId: string;
  playerName: string;
  triggerContext?: string;
  onClose: () => void;
}

export default function ChamberOfEchoes({ 
  isOpen, 
  playerId, 
  playerName,
  triggerContext = "你感到了某种内心的冲突和疑惑...",
  onClose
}: ChamberOfEchoesProps) {
  const [echoContent, setEchoContent] = useState<EchoContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const enterChamber = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🪞 进入回响之室...', { playerId, playerName, triggerContext });

      const response = await fetch('/api/echo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          player_name: playerName,
          trigger_context: triggerContext
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEchoContent(result.echo_content);
        console.log('✨ 回响之室内容生成成功:', result.echo_content);
      } else {
        setError(result.error || '回响之室暂时无法访问');
      }
    } catch (err) {
      setError('网络连接错误，请稍后再试');
      console.error('回响之室错误:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        {/* 头部 */}
        <div className="p-6 border-b border-purple-500/30">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              🪞 回响之室
              <span className="text-sm text-purple-300 font-normal">
                意识的镜像
              </span>
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          
          {/* 未进入状态 */}
          {!echoContent && !isLoading && !error && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🌀</div>
              <p className="text-purple-200 leading-relaxed">
                你的内心深处似乎有些波动...
              </p>
              <p className="text-gray-300 text-sm">
                在这个空间里，你将看到事件的另一种解释——
                <br />
                一种完全基于你内在信念的主观视角
              </p>
              <button
                onClick={enterChamber}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
              >
                进入回响之室
              </button>
            </div>
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div className="text-center space-y-4">
              <div className="animate-spin text-4xl">🌀</div>
              <p className="text-purple-200">
                正在分析你的内心世界...
              </p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="text-center space-y-4">
              <div className="text-4xl">⚠️</div>
              <p className="text-red-300">{error}</p>
              <button
                onClick={enterChamber}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
              >
                重试
              </button>
            </div>
          )}

          {/* 回响内容 */}
          {echoContent && (
            <div className="space-y-6">
              
              {/* 触发情境 */}
              <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
                <h3 className="text-sm font-medium text-purple-300 mb-2">认知触发</h3>
                <p className="text-purple-100 italic">"{triggerContext}"</p>
              </div>

              {/* 主观解释 */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-purple-500/20">
                <h3 className="text-lg font-semibold text-purple-200 mb-3 flex items-center gap-2">
                  💭 内在理解
                </h3>
                <div className="text-white leading-relaxed">
                  {echoContent.subjective_explanation}
                </div>
              </div>

              {/* 支持记忆 */}
              {echoContent.supporting_memories && echoContent.supporting_memories.length > 0 && (
                <div className="bg-indigo-900/30 rounded-xl p-5 border border-indigo-500/20">
                  <h3 className="text-lg font-semibold text-indigo-200 mb-3 flex items-center gap-2">
                    🧠 支持记忆
                  </h3>
                  <div className="space-y-3">
                    {echoContent.supporting_memories.map((memory, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-indigo-400 text-sm mt-1">•</span>
                        <span className="text-indigo-100 text-sm leading-relaxed italic">
                          {memory}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 信念连接 */}
              <div className="bg-amber-900/20 rounded-xl p-5 border border-amber-500/20">
                <h3 className="text-lg font-semibold text-amber-200 mb-3 flex items-center gap-2">
                  ⚡ 信念共鸣
                </h3>
                <div className="text-amber-100 leading-relaxed">
                  {echoContent.belief_connection}
                </div>
              </div>

              {/* 情感共鸣 */}
              <div className="bg-rose-900/20 rounded-xl p-5 border border-rose-500/20">
                <h3 className="text-lg font-semibold text-rose-200 mb-3 flex items-center gap-2">
                  💖 情感觉醒
                </h3>
                <div className="text-rose-100 leading-relaxed">
                  {echoContent.emotional_resonance}
                </div>
              </div>

              {/* 智慧洞察 */}
              <div className="bg-green-900/20 rounded-xl p-5 border border-green-500/20">
                <h3 className="text-lg font-semibold text-green-200 mb-3 flex items-center gap-2">
                  🌟 智慧洞察
                </h3>
                <div className="text-green-100 leading-relaxed font-medium">
                  {echoContent.wisdom_insight}
                </div>
              </div>

              {/* 行动建议 */}
              {echoContent.action_suggestions && echoContent.action_suggestions.length > 0 && (
                <div className="bg-blue-900/20 rounded-xl p-5 border border-blue-500/20">
                  <h3 className="text-lg font-semibold text-blue-200 mb-3 flex items-center gap-2">
                    🎯 内在指引
                  </h3>
                  <div className="space-y-3">
                    {echoContent.action_suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-blue-400 text-sm mt-1">→</span>
                        <span className="text-blue-100 text-sm leading-relaxed">
                          {suggestion}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 信念强度指示 */}
              {echoContent.belief_alignment_score !== undefined && (
                <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-purple-300">信念系统强度</span>
                    <span className="text-purple-200">
                      {(echoContent.belief_alignment_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-purple-900/40 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-300 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${echoContent.belief_alignment_score * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* 时间戳 */}
              <div className="text-center text-xs text-gray-400">
                生成时间: {new Date(echoContent.generated_at).toLocaleString()}
              </div>

              {/* 关闭按钮 */}
              <div className="text-center pt-4">
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg"
                >
                  带着这份理解离开回响之室
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}