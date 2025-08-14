#!/usr/bin/env python3
"""
直接测试Vercel AI Gateway聊天功能
"""

import requests
import json

def test_chat_call():
    """
    测试实际的聊天调用
    """
    API_KEY = "EtMyP4WaMfdkxizkutRrJT1j"
    
    # 基于405响应，这个端点存在，尝试POST请求
    CHAT_URL = "https://ai-gateway.vercel.sh/v1/ai/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # 测试不同模型名称格式
    models_to_test = [
        "gpt-4o-mini",
        "openai/gpt-4o-mini", 
        "gpt-4o",
        "anthropic/claude-3-5-sonnet",
        "claude-3-5-sonnet"
    ]
    
    for model in models_to_test:
        print(f"\n测试模型: {model}")
        print("=" * 50)
        
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": "Hello! Please respond with just 'Hi there' and nothing else."}
            ],
            "max_tokens": 10
        }
        
        try:
            response = requests.post(CHAT_URL, headers=headers, json=payload)
            print(f"状态码: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ 成功! 响应: {result['choices'][0]['message']['content']}")
                return model, CHAT_URL  # 返回第一个成功的模型
            else:
                print(f"❌ 失败: {response.text[:200]}")
                
        except Exception as e:
            print(f"❌ 异常: {e}")
    
    print("\n所有模型测试完毕")
    return None, None

def test_streaming_chat():
    """
    测试流式聊天
    """
    API_KEY = "EtMyP4WaMfdkxizkutRrJT1j"
    CHAT_URL = "https://ai-gateway.vercel.sh/v1/ai/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "user", "content": "Count from 1 to 5"}
        ],
        "max_tokens": 20,
        "stream": True
    }
    
    print("\n测试流式响应:")
    print("=" * 50)
    
    try:
        response = requests.post(CHAT_URL, headers=headers, json=payload, stream=True)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ 流式响应开始:")
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    print(f"  {line_str}")
                    if 'data: [DONE]' in line_str:
                        break
        else:
            print(f"❌ 流式请求失败: {response.text}")
            
    except Exception as e:
        print(f"❌ 流式请求异常: {e}")

if __name__ == "__main__":
    print("Vercel AI Gateway 聊天测试工具")
    print("=" * 50)
    
    # 测试普通聊天
    working_model, working_url = test_chat_call()
    
    if working_model:
        print(f"\n🎉 找到可用配置:")
        print(f"  模型: {working_model}")
        print(f"  端点: {working_url}")
        
        # 测试流式聊天
        test_streaming_chat()
        
        # 保存配置
        config = {
            "working_model": working_model,
            "working_url": working_url,
            "api_key": "EtMyP4WaMfdkxizkutRrJT1j"
        }
        
        with open("../docs/working-ai-config.json", "w") as f:
            json.dump(config, f, indent=2)
        print(f"\n✅ 工作配置已保存到: ../docs/working-ai-config.json")
    else:
        print("\n❌ 未找到可用的模型配置")