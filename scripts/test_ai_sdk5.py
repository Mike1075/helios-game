#!/usr/bin/env python3
"""
测试AI SDK 5实现
"""

import requests
import json

def test_ai_sdk5_chat():
    """
    测试AI SDK 5聊天功能
    """
    print("=== 测试AI SDK 5聊天功能 ===")
    
    chat_payload = {
        "messages": [
            {
                "role": "user", 
                "content": "Hello! Please respond with just 'Hi from GPT-5 Mini!'"
            }
        ]
    }
    
    try:
        print(f"发送请求到Next.js API Route...")
        print(f"请求负载: {json.dumps(chat_payload, indent=2)}")
        
        response = requests.post(
            "http://localhost:3000/api/chat",
            json=chat_payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ AI SDK 5响应成功!")
            print(f"AI回复: '{result.get('content', 'No content')}'")
            return True
        else:
            print(f"❌ 请求失败: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return False

if __name__ == "__main__":
    print("AI SDK 5测试工具")
    print("=" * 50)
    
    if test_ai_sdk5_chat():
        print("\n🎉 AI SDK 5聊天功能正常!")
        print("\n📝 现在可以:")
        print("1. 访问 http://localhost:3000/chat")
        print("2. 与GPT-5 Mini进行对话")
        print("3. 使用简单的非流式聊天")
    else:
        print("\n❌ AI SDK 5聊天功能异常，请检查配置")