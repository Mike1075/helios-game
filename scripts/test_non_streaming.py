#!/usr/bin/env python3
"""
测试非流式聊天功能
"""

import requests
import json

def test_non_streaming_chat():
    """
    测试非流式聊天
    """
    print("=== 测试非流式聊天功能 ===")
    
    chat_payload = {
        "messages": [
            {
                "role": "user", 
                "content": "Hello! Please respond with just 'Hi from Claude!'",
                "id": "test-1"
            }
        ],
        "model": "anthropic/claude-3-5-sonnet",
        "stream": False
    }
    
    try:
        print(f"发送非流式请求...")
        print(f"请求负载: {json.dumps(chat_payload, indent=2)}")
        
        response = requests.post(
            "http://localhost:8000/api/chat",
            json=chat_payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 非流式响应成功!")
            print(f"AI回复: '{result.get('content', 'No content')}'")
            return True
        else:
            print(f"❌ 请求失败: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return False

if __name__ == "__main__":
    print("非流式聊天测试工具")
    print("=" * 50)
    
    if test_non_streaming_chat():
        print("\n🎉 非流式聊天功能正常!")
        print("\n📝 现在可以:")
        print("1. 访问 http://localhost:3000")
        print("2. 点击 '🚀 开始AI聊天'")
        print("3. 与AI进行非流式对话")
    else:
        print("\n❌ 非流式聊天功能异常，请检查配置")