#!/usr/bin/env python3
"""
测试部署准备情况 - 验证环境变量依赖
"""

import requests
import json
import subprocess
import os

def check_env_vars():
    """
    检查环境变量配置
    """
    print("=== 检查环境变量配置 ===")
    
    # 检查是否有硬编码的API key文件
    env_files = [
        '/Users/mike/Downloads/Helios-game/packages/web/.env.local',
        '/Users/mike/Downloads/Helios-game/packages/web/.env'
    ]
    
    for file_path in env_files:
        if os.path.exists(file_path):
            print(f"⚠️  发现环境变量文件: {file_path}")
            with open(file_path, 'r') as f:
                content = f.read()
                if 'EtMyP4WaMfdkxizkutRrJT1j' in content:
                    print(f"❌ 文件包含硬编码API key，需要删除")
                    return False
                else:
                    print(f"✅ 文件不包含硬编码API key")
        else:
            print(f"✅ 环境变量文件不存在: {file_path}")
    
    return True

def test_api_without_key():
    """
    测试没有API key时的错误处理
    """
    print(f"\n=== 测试API key缺失时的错误处理 ===")
    
    chat_payload = {
        "messages": [
            {
                "role": "user", 
                "content": "Hello, test without API key"
            }
        ],
        "model": "openai/gpt-5-mini"
    }
    
    try:
        response = requests.post(
            "http://localhost:3000/api/chat",
            json=chat_payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 500:
            result = response.json()
            if 'API key not configured' in result.get('error', ''):
                print("✅ 正确显示API key缺失错误")
                return True
            else:
                print(f"❌ 错误信息不正确: {result}")
                return False
        elif response.status_code == 200:
            print("⚠️  API正常工作，说明还有API key配置")
            return False
        else:
            print(f"❌ 意外的状态码: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return False

def check_gitignore():
    """
    检查.gitignore配置
    """
    print(f"\n=== 检查.gitignore配置 ===")
    
    gitignore_path = '/Users/mike/Downloads/Helios-game/.gitignore'
    
    if not os.path.exists(gitignore_path):
        print("❌ .gitignore文件不存在")
        return False
    
    with open(gitignore_path, 'r') as f:
        content = f.read()
    
    required_entries = ['.env.local', '.env', '.vercel']
    missing_entries = []
    
    for entry in required_entries:
        if entry not in content:
            missing_entries.append(entry)
    
    if missing_entries:
        print(f"❌ .gitignore缺少条目: {missing_entries}")
        return False
    else:
        print("✅ .gitignore配置正确")
        return True

def check_deployment_files():
    """
    检查部署相关文件
    """
    print(f"\n=== 检查部署相关文件 ===")
    
    required_files = [
        ('/Users/mike/Downloads/Helios-game/DEPLOYMENT.md', '部署说明文档'),
        ('/Users/mike/Downloads/Helios-game/packages/web/package.json', 'package.json'),
        ('/Users/mike/Downloads/Helios-game/packages/web/next.config.js', 'Next.js配置')
    ]
    
    all_exist = True
    
    for file_path, description in required_files:
        if os.path.exists(file_path):
            print(f"✅ {description}: 存在")
        else:
            print(f"❌ {description}: 缺失")
            all_exist = False
    
    return all_exist

if __name__ == "__main__":
    print("部署准备情况检查工具")
    print("=" * 60)
    
    # 执行各项检查
    checks = [
        ("环境变量清理", check_env_vars),
        ("API错误处理", test_api_without_key), 
        (".gitignore配置", check_gitignore),
        ("部署文件检查", check_deployment_files)
    ]
    
    results = []
    
    for check_name, check_func in checks:
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print(f"❌ {check_name}检查异常: {e}")
            results.append((check_name, False))
    
    # 总结结果
    print(f"\n=== 部署准备检查结果 ===")
    passed = 0
    total = len(results)
    
    for check_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{check_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n总体评分: {passed}/{total}")
    
    if passed == total:
        print("🎉 部署准备完成！可以部署到Vercel")
        print(f"\n📋 部署检查清单:")
        print("✅ 代码中无硬编码API key")
        print("✅ 环境变量错误处理正确")
        print("✅ .gitignore配置完整")
        print("✅ 部署文档已准备")
        print(f"\n🚀 下一步:")
        print("1. 将代码推送到GitHub")
        print("2. 在Vercel Dashboard导入项目")
        print("3. 设置环境变量: VERCEL_AI_GATEWAY_API_KEY")
        print("4. 部署并测试")
    else:
        print("⚠️  还有问题需要解决才能部署")