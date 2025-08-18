/**
 * 回响之室组件
 * 
 * 当检测到认知失调时，为玩家提供深度自省体验
 * 基于其信念系统生成主观归因解释
 */

'use client';

import { useState } from 'react';

interface EchoContent {
  attribution: string;
  evidence: string[];
  insight: string;
  generated_at: number;
}

interface ChamberOfEchoesProps {
  isOpen: boolean;
  playerId: string;
  eventId: string;
  onClose: () => void;
  currentBeliefs?: any;
}

export default function ChamberOfEchoes({ 
  isOpen, 
  playerId, 
  eventId, 
  onClose, 
  currentBeliefs 
}: ChamberOfEchoesProps) {
  const [echoContent, setEchoContent] = useState<EchoContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const enterChamber = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🪞 进入回响之室...', { playerId, eventId });

      const response = await fetch('/api/echo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: playerId,
          event_id: eventId,
          current_beliefs: currentBeliefs
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
              
              {/* 主观归因 */}
              <div className="bg-purple-800/30 rounded-xl p-5 border border-purple-500/20">
                <h3 className="text-lg font-semibold text-purple-200 mb-3 flex items-center gap-2">
                  💭 内心的声音
                </h3>
                <div className="text-white leading-relaxed whitespace-pre-wrap">
                  {echoContent.attribution}
                </div>
              </div>

              {/* 记忆证据 */}
              {echoContent.evidence && echoContent.evidence.length > 0 && (
                <div className="bg-blue-800/30 rounded-xl p-5 border border-blue-500/20">
                  <h3 className="text-lg font-semibold text-blue-200 mb-3 flex items-center gap-2">
                    📚 记忆的回声
                  </h3>
                  <div className="space-y-3">
                    {echoContent.evidence.map((evidence, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-blue-400 text-sm mt-1">
                          {index + 1}.
                        </span>
                        <span className="text-blue-100 text-sm leading-relaxed">
                          {evidence}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 核心洞察 */}
              {echoContent.insight && (
                <div className="bg-indigo-800/30 rounded-xl p-5 border border-indigo-500/20">
                  <h3 className="text-lg font-semibold text-indigo-200 mb-3 flex items-center gap-2">
                    ✨ 深层洞察
                  </h3>
                  <div className="text-indigo-100 leading-relaxed italic">
                    "{echoContent.insight}"
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
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-all"
                >
                  离开回响之室
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}