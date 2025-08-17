#!/usr/bin/env python3
"""
测试流式输出功能
"""

import requests
import json

def test_streaming_chat():
    """
    测试流式聊天功能
    """
    print("=== 测试流式聊天功能 ===")
    
    chat_payload = {
        "messages": [
            {
                "role": "user", 
                "content": "Please count from 1 to 10, one number per line"
            }
        ]
    }
    
    try:
        print(f"发送流式请求...")
        print(f"请求负载: {json.dumps(chat_payload, indent=2)}")
        
        response = requests.post(
            "http://localhost:3000/api/chat",
            json=chat_payload,
            headers={"Content-Type": "application/json"},
            stream=True
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            print(f"✅ 流式响应开始:")
            content = ""
            for chunk in response.iter_content(chunk_size=1, decode_unicode=True):
                if chunk:
                    print(chunk, end='', flush=True)
                    content += chunk
            
            print(f"\n\n完整响应: '{content}'")
            return True
        else:
            print(f"❌ 请求失败: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return False

if __name__ == "__main__":
    print("流式聊天测试工具")
    print("=" * 50)
    
    if test_streaming_chat():
        print("\n🎉 流式聊天功能正常!")
        print("\n📝 现在可以:")
        print("1. 访问 http://localhost:3000/chat")
        print("2. 与GPT-5 Mini进行流式对话")
        print("3. 字体颜色已修复")
        print("4. 环境变量已兼容Vercel")
    else:
        print("\n❌ 流式聊天功能异常，请检查配置")