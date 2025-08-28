# 📋 n8n 数据引用指南

## 🚨 常见问题：显示 [object Object]

当您在 n8n 表达式中看到 `[object Object]` 时，说明您在尝试直接显示一个对象，而不是对象中的具体字段。

## ✅ 正确的数据引用方式

### 1. 信念系统数据引用

```javascript
// ❌ 错误 (显示 [object Object])
{{ $("获取信念系统") }}

// ✅ 正确 - 获取所有信念内容
{{ $("获取信念系统").all().map(item => item.json.content).join(', ') }}

// ✅ 正确 - 获取第一条信念
{{ $("获取信念系统").first().json.content }}

// ✅ 正确 - 格式化显示
{{ $("获取信念系统").all().map(item => `信念: ${item.json.content}`).join('\n') }}
```

### 2. 内驱力数据引用

```javascript
// ✅ 获取所有内驱力内容
{{ $("获取内驱力").all().map(item => item.json.content).join(', ') }}

// ✅ 获取第一条内驱力
{{ $("获取内驱力").first().json.content }}
```

### 3. 外我特征数据引用

```javascript
// ✅ 获取所有外我特征内容
{{ $("获取外我特征-行为").all().map(item => item.json.content).join(', ') }}

// ✅ 获取所有反应特征内容
{{ $("获取外我特征-反应").all().map(item => item.json.content).join(', ') }}
```

### 4. 集体无意识数据引用

```javascript
// ❌ 错误 (显示 [object Object])
{{ $("获取集体无意识") }}

// ✅ 正确 - 获取所有集体无意识内容
{{ $("获取集体无意识").all().map(item => item.json.content).join(', ') }}

// ✅ 正确 - 获取前5条内容
{{ $("获取集体无意识").all().slice(0, 5).map(item => item.json.content).join(', ') }}

// ✅ 正确 - 换行分隔
{{ $("获取集体无意识").all().map(item => item.json.content).join('\n') }}
```

## 🎯 在 LangChain Agent 中的使用

### 完整的角色数据组合

```javascript
// 组合所有角色数据
角色信念: {{ $("获取信念系统").all().map(item => item.json.content).join(', ') }}

角色内驱力: {{ $("获取内驱力").all().map(item => item.json.content).join(', ') }}

角色行为特征: {{ $("获取外我特征-行为").all().map(item => item.json.content).join(', ') }}

角色反应特征: {{ $("获取外我特征-反应").all().map(item => item.json.content).join(', ') }}

集体无意识: {{ $("获取集体无意识").all().map(item => item.json.content).join(', ') }}
```

## 🔧 调试技巧

### 1. 查看数据结构
```javascript
// 查看完整的数据结构
{{ JSON.stringify($("获取集体无意识").first().json, null, 2) }}
```

### 2. 检查数据数量
```javascript
// 检查返回了多少条数据
{{ $("获取集体无意识").all().length }}
```

### 3. 查看所有字段
```javascript
// 查看第一条数据的所有字段
{{ Object.keys($("获取集体无意识").first().json) }}
```

## 📝 常用模板

### 模板1: 简洁版本
```javascript
信念: {{ $("获取信念系统").all().map(item => item.json.content).join(', ') }}
内驱力: {{ $("获取内驱力").all().map(item => item.json.content).join(', ') }}
行为: {{ $("获取外我特征-行为").all().map(item => item.json.content).join(', ') }}
反应: {{ $("获取外我特征-反应").all().map(item => item.json.content).join(', ') }}
集体无意识: {{ $("获取集体无意识").all().map(item => item.json.content).join(', ') }}
```

### 模板2: 详细版本
```javascript
角色信念系统:
{{ $("获取信念系统").all().map(item => `- ${item.json.content}`).join('\n') }}

角色内驱力:
{{ $("获取内驱力").all().map(item => `- ${item.json.content}`).join('\n') }}

角色行为特征:
{{ $("获取外我特征-行为").all().map(item => `- ${item.json.content}`).join('\n') }}

角色反应特征:
{{ $("获取外我特征-反应").all().map(item => `- ${item.json.content}`).join('\n') }}

集体无意识:
{{ $("获取集体无意识").all().map(item => `- ${item.json.content}`).join('\n') }}
```
