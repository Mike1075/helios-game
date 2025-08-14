#!/usr/bin/env python3
"""
测试前端聊天功能 - 模拟浏览器请求
"""

import requests
import json

def test_frontend_to_fastapi():
    """
    模拟前端直接调用FastAPI后端
    """
    print("=== 测试前端到FastAPI的直接调用 ===")
    
    # 模拟前端发送的请求格式 (AI SDK useChat hook)
    chat_payload = {
        "messages": [
            {
                "role": "user", 
                "content": "Hello! Please respond with just 'Hi from Helios AI!'",
                "id": "test-1"
            }
        ],
        "model": "anthropic/claude-3-5-sonnet",
        "stream": True
    }
    
    try:
        print(f"发送请求到: http://localhost:8000/api/chat")
        print(f"请求负载: {json.dumps(chat_payload, indent=2)}")
        
        response = requests.post(
            "http://localhost:8000/api/chat",
            json=chat_payload,
            headers={
                "Content-Type": "application/json",
                "Accept": "text/event-stream"
            },
            stream=True
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("\n✅ 流式响应内容:")
            content_received = ""
            
            for line in response.iter_lines(decode_unicode=True):
                if line:
                    print(f"  {line}")
                    if line.startswith('data: ') and not line.endswith('[DONE]'):
                        try:
                            data = json.loads(line[6:])  # 移除 'data: ' 前缀
                            if 'content' in data:
                                content_received += data['content']
                        except:
                            pass
                    elif 'data: [DONE]' in line:
                        break
            
            print(f"\n完整AI响应: '{content_received}'")
            
            if content_received:
                print("🎉 前端到FastAPI的聊天功能测试成功!")
                return True
            else:
                print("❌ 未收到AI响应内容")
                return False
        else:
            print(f"❌ 请求失败: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return False

def test_cors():
    """
    测试CORS配置是否正确
    """
    print("\n=== 测试CORS配置 ===")
    
    try:
        # 发送预检请求 (OPTIONS)
        response = requests.options(
            "http://localhost:8000/api/chat",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
        )
        
        print(f"预检请求状态码: {response.status_code}")
        print(f"CORS响应头:")
        for header, value in response.headers.items():
            if 'access-control' in header.lower():
                print(f"  {header}: {value}")
        
        if response.status_code == 200:
            print("✅ CORS配置正确")
            return True
        else:
            print("❌ CORS配置可能有问题")
            return False
            
    except Exception as e:
        print(f"❌ CORS测试异常: {e}")
        return False

if __name__ == "__main__":
    print("前端聊天功能测试工具")
    print("=" * 50)
    
    success_count = 0
    total_tests = 2
    
    if test_frontend_to_fastapi():
        success_count += 1
    
    if test_cors():
        success_count += 1
    
    print(f"\n=== 测试总结 ===")
    print(f"通过: {success_count}/{total_tests}")
    
    if success_count == total_tests:
        print("🎉 前端聊天功能完全正常!")
        print("\n📝 使用说明:")
        print("1. 打开浏览器访问: http://localhost:3000")
        print("2. 点击 '🚀 开始AI聊天'")
        print("3. 选择模型: anthropic/claude-3-5-sonnet")
        print("4. 开始与AI对话")
    else:
        print("❌ 部分功能可能存在问题，请检查配置")