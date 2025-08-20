'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [results, setResults] = useState<any[]>([]);

  const testConnection = async () => {
    const tests = [
      {
        name: '环境变量检查',
        test: async () => {
          return {
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 存在' : '❌ 缺失',
            SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 存在' : '❌ 缺失',
            urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
            keyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
          };
        }
      },
      {
        name: '基础连接测试',
        test: async () => {
          const { data, error } = await supabase
            .from('character_states')
            .select('*')
            .limit(1);
          
          return {
            success: !error,
            error: error?.message,
            data: data
          };
        }
      },
      {
        name: '实时连接测试',
        test: async () => {
          return new Promise((resolve) => {
            const channel = supabase
              .channel('test_channel')
              .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'character_states'
              }, () => {})
              .subscribe((status) => {
                resolve({
                  status,
                  success: status === 'SUBSCRIBED'
                });
              });
            
            // 5秒后超时
            setTimeout(() => {
              channel.unsubscribe();
              resolve({
                status: 'TIMEOUT',
                success: false
              });
            }, 5000);
          });
        }
      }
    ];

    const newResults = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        newResults.push({
          name: test.name,
          success: true,
          result
        });
      } catch (error) {
        newResults.push({
          name: test.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    setResults(newResults);
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">🔧 Supabase 连接调试</h1>
      
      <button
        onClick={testConnection}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mb-6"
      >
        开始测试
      </button>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              result.success ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'
            }`}
          >
            <h3 className="font-bold mb-2">
              {result.success ? '✅' : '❌'} {result.name}
            </h3>
            <pre className="text-sm bg-gray-800 p-2 rounded overflow-auto">
              {JSON.stringify(result.success ? result.result : result.error, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}