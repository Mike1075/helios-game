@echo off
chcp 65001 >nul
echo ========================================
echo 赫利俄斯港口酒馆 - 自动启动脚本
echo ========================================
echo.

:: 检查是否在正确的目录
if not exist "package.json" (
    echo ❌ 错误：请在web目录下运行此脚本
    echo 当前目录：%CD%
    echo 请切换到包含package.json的web目录
    pause
    exit /b 1
)

echo ✅ 检测到package.json，确认在正确目录
echo.

:: 检查端口3000是否被占用
echo 🔍 检查端口3000状态...
netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  端口3000已被占用，正在终止占用进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    echo ✅ 端口3000已释放
    echo.
)

:: 检查Node.js是否安装
echo 🔍 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到Node.js，请先安装Node.js
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

:: 显示Node.js版本
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js版本：%NODE_VERSION%

:: 检查npm是否可用
echo 🔍 检查npm环境...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：npm不可用，请检查Node.js安装
    pause
    exit /b 1
)

:: 显示npm版本
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm版本：%NPM_VERSION%
echo.

:: 检查依赖是否已安装
if not exist "node_modules" (
    echo 📦 检测到node_modules不存在，正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
) else (
    echo ✅ 依赖已安装
    echo.
)

:: 启动开发服务器
echo 🚀 启动赫利俄斯港口酒馆开发服务器...
echo.
echo 📍 服务器地址：http://localhost:3000
echo 📍 信念系统：点击"信念系统"按钮查看
echo 📍 角色介绍：点击"角色介绍"按钮查看
echo.
echo ⚠️  按 Ctrl+C 停止服务器
echo ========================================
echo.

:: 启动服务器
npm run dev

:: 如果服务器意外停止，显示错误信息
if %errorlevel% neq 0 (
    echo.
    echo ❌ 服务器意外停止，错误代码：%errorlevel%
    echo.
    echo 🔧 可能的解决方案：
    echo 1. 检查端口3000是否被其他程序占用
    echo 2. 检查防火墙设置
    echo 3. 重新运行此脚本
    echo.
    pause
)
