# 🔧 Aggregate 节点数据引用解决方案

## 🚨 问题分析
您使用 `{{ $('Aggregate').item.json.data }}` 引用聚合数据，但显示的是 `[object Object]` 而不是实际内容。

## ✅ 解决方案

### 方案1: 提取并格式化所有聚合数据
```javascript
{{ $('Aggregate').item.json.data.map(item => {
  if (item.content) return item.content;
  return JSON.stringify(item);
}).join('\n') }}
```

### 方案2: 分别引用各个数据源
```javascript
信念系统: {{ $('Aggregate').item.json.data.filter(item => item.character_id).map(item => item.content).join(', ') }}

集体无意识: {{ $('Aggregate').item.json.data.filter(item => !item.character_id).map(item => item.content).join(', ') }}
```

### 方案3: 直接引用原始节点（推荐）
```javascript
信念系统: {{ $("获取信念系统").all().map(item => item.json.content).join(', ') }}

内驱力: {{ $("获取内驱力").all().map(item => item.json.content).join(', ') }}

外我特征-行为: {{ $("获取外我特征-行为").all().map(item => item.json.content).join(', ') }}

外我特征-反应: {{ $("获取外我特征-反应").all().map(item => item.json.content).join(', ') }}

集体无意识: {{ $("获取集体无意识").all().map(item => item.json.content).join(', ') }}
```

### 方案4: 完整的格式化输出
```javascript
角色信念系统:
{{ $("获取信念系统").all().map(item => `- ${item.json.content}`).join('\n') }}

角色内驱力:
{{ $("获取内驱力").all().map(item => `- ${item.json.content}`).join('\n') }}

角色行为特征:
{{ $("获取外我特征-行为").all().map(item => `- ${item.json.content}`).join('\n') }}

角色反应特征:
{{ $("获取外我特征-反应").all().map(item => `- ${item.json.content}`).join('\n') }}

集体无意识规律:
{{ $("获取集体无意识").all().map(item => `- ${item.json.content}`).join('\n') }}
```

## 🎯 推荐使用方案3或方案4
- **方案3**: 简洁，适合在 prompt 中使用
- **方案4**: 格式化好，适合给用户显示

## 🔧 调试方法
如果不确定 Aggregate 的数据结构，先用这个查看：
```javascript
{{ JSON.stringify($('Aggregate').item.json.data, null, 2) }}
```
