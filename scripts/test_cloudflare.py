#!/usr/bin/env python3
"""
测试这是否是Cloudflare AI Gateway的API Key
"""

import requests
import json

def test_cloudflare_ai_gateway():
    """
    测试Cloudflare AI Gateway
    """
    API_KEY = "EtMyP4WaMfdkxizkutRrJT1j"
    
    # Cloudflare AI Gateway格式通常是这样的
    # https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_slug}/openai
    
    # 尝试一些可能的Cloudflare格式
    cloudflare_endpoints = [
        "https://gateway.ai.cloudflare.com/v1/helios-ai-gateway/openai/chat/completions",
        "https://api.cloudflare.com/client/v4/ai/chat/completions",
        f"https://gateway.ai.cloudflare.com/v1/{API_KEY}/openai/chat/completions",
    ]
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "user", "content": "Hello"}
        ],
        "max_tokens": 5
    }
    
    for endpoint in cloudflare_endpoints:
        print(f"\n测试Cloudflare端点: {endpoint}")
        try:
            response = requests.post(endpoint, headers=headers, json=payload)
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text[:200]}")
            
            if response.status_code == 200:
                print("✅ Cloudflare AI Gateway可用!")
                return endpoint
                
        except Exception as e:
            print(f"错误: {e}")
    
    return None

def test_direct_openai():
    """
    测试这个key是否是OpenAI的key
    """
    API_KEY = "EtMyP4WaMfdkxizkutRrJT1j"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 5
    }
    
    print(f"\n测试OpenAI官方API:")
    try:
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text[:200]}")
        
        if response.status_code == 200:
            print("✅ 这是OpenAI API Key!")
            return True
            
    except Exception as e:
        print(f"错误: {e}")
    
    return False

def analyze_key_format():
    """
    分析API Key格式
    """
    API_KEY = "EtMyP4WaMfdkxizkutRrJT1j"
    
    print(f"\nAPI Key分析:")
    print(f"长度: {len(API_KEY)}")
    print(f"格式: {API_KEY}")
    
    # OpenAI keys通常以sk-开头
    if API_KEY.startswith("sk-"):
        print("这看起来像OpenAI API Key")
    elif len(API_KEY) == 20:
        print("这可能是某种自定义Gateway Key")
    else:
        print("未知格式的API Key")

if __name__ == "__main__":
    print("API Key格式检测工具")
    print("=" * 50)
    
    analyze_key_format()
    
    # 测试不同服务
    if test_direct_openai():
        print("\n🎉 这是有效的OpenAI API Key")
    else:
        endpoint = test_cloudflare_ai_gateway()
        if endpoint:
            print(f"\n🎉 找到可用的Cloudflare端点: {endpoint}")
        else:
            print("\n❌ 未找到匹配的AI Gateway服务")
            print("\n建议检查:")
            print("1. API Key是否正确")
            print("2. 是否需要特定的Gateway URL")
            print("3. 是否有使用限制或过期")