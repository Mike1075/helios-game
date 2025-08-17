#!/usr/bin/env python3
"""
测试前后端集成 - 模拟前端调用后端API
"""

import requests
import json

def test_frontend_backend_integration():
    """
    测试前端到后端的完整流程
    """
    print("=== 测试前后端集成 ===")
    
    # 1. 测试FastAPI健康检查
    print("\n1. 测试FastAPI健康检查...")
    try:
        response = requests.get("http://localhost:8000/api/health")
        print(f"✅ 健康检查: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ 健康检查失败: {e}")
        return False
    
    # 2. 测试聊天API (模拟前端请求)
    print("\n2. 测试聊天API...")
    chat_payload = {
        "messages": [
            {"role": "user", "content": "Hello! Please respond with just 'Hi there'", "id": "1"}
        ],
        "model": "anthropic/claude-3-5-sonnet",
        "stream": False
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/chat",
            json=chat_payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ 聊天API: {response.status_code}")
        
        if response.status_code == 200:
            # 处理流式响应
            content = response.text
            print(f"响应内容预览: {content[:200]}...")
            return True
        else:
            print(f"❌ 聊天API失败: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 聊天API异常: {e}")
        return False

def test_model_list():
    """
    测试模型列表获取
    """
    print("\n3. 测试模型列表...")
    try:
        response = requests.get("http://localhost:8000/api/models")
        if response.status_code == 200:
            models = response.json()
            print(f"✅ 获取到 {len(models.get('data', []))} 个模型")
            # 显示前5个模型
            for i, model in enumerate(models.get('data', [])[:5]):
                print(f"  {i+1}. {model.get('id', 'Unknown')} - {model.get('name', 'No name')}")
            return True
        else:
            print(f"❌ 模型列表失败: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 模型列表异常: {e}")
        return False

def check_services():
    """
    检查服务状态
    """
    print("\n=== 服务状态检查 ===")
    
    # 检查FastAPI
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        print(f"✅ FastAPI服务: 运行中 (端口8000)")
    except Exception:
        print(f"❌ FastAPI服务: 未运行 (端口8000)")
    
    # 检查Next.js
    try:
        response = requests.get("http://localhost:3000/", timeout=5)
        print(f"✅ Next.js服务: 运行中 (端口3000)")
    except Exception:
        print(f"❌ Next.js服务: 未运行 (端口3000)")

if __name__ == "__main__":
    print("前后端集成测试工具")
    print("=" * 50)
    
    check_services()
    
    # 运行集成测试
    success_count = 0
    total_tests = 3
    
    if test_frontend_backend_integration():
        success_count += 1
    
    if test_model_list():
        success_count += 1
        
    # 总结
    print(f"\n=== 测试总结 ===")
    print(f"通过: {success_count}/{total_tests}")
    
    if success_count == total_tests:
        print("🎉 所有测试通过！前后端集成正常")
        print("\n✅ 可用配置:")
        print("  - 前端: http://localhost:3000")
        print("  - 后端: http://localhost:8000") 
        print("  - 模型: anthropic/claude-3-5-sonnet")
        print("  - API Key: EtMyP4WaMfdkxizkutRrJT1j")
    else:
        print("❌ 部分测试失败，请检查配置")