# 赫利俄斯港口酒馆 - UI设计指南

## 设计理念

### 主题风格
- **中世纪港口风格**：采用深色木质纹理、复古字体、航海元素
- **酒馆氛围**：温暖的灯光效果、木质家具质感、复古装饰元素
- **神秘感**：深色调为主，配合金色或铜色点缀

### 色彩方案
- **主色调**：琥珀色系 (amber-600, amber-700, amber-800, amber-900)
- **辅助色**：蓝色、紫色、黄色、青色（用于不同角色）
- **背景色**：渐变琥珀色背景，营造温暖氛围
- **文字色**：深灰色和白色，确保可读性

## 组件设计

### 1. 聊天界面 (ChatInterface.tsx)
- **标题栏**：渐变背景，包含酒馆名称和角色介绍按钮
- **消息区域**：不同角色使用不同颜色的消息气泡
- **输入区域**：带有字符计数和快捷提示
- **动画效果**：消息出现动画、悬停效果、加载动画

### 2. 角色创建页面 (create-character.tsx)
- **背景装饰**：固定位置的装饰元素（城堡、锚、酒杯、金币）
- **表单设计**：圆角卡片，渐变背景
- **交互反馈**：按钮悬停效果、输入框焦点状态

### 3. 角色面板 (CharacterPanel.tsx)
- **模态框设计**：半透明背景，居中显示
- **角色卡片**：网格布局，每个角色有独特的颜色主题
- **标签系统**：显示角色特色标签

## 动画效果

### 1. 消息动画
```css
.message-user {
  animation: slideInFromRight 0.5s ease-out;
}

.message-assistant {
  animation: slideInFromLeft 0.5s ease-out;
}
```

### 2. 加载动画
```css
.bounce-dot {
  animation: bounce 1.4s infinite ease-in-out both;
}
```

### 3. 悬停效果
```css
.glow {
  box-shadow: 0 0 20px rgba(217, 119, 6, 0.3);
}

.glow:hover {
  box-shadow: 0 0 30px rgba(217, 119, 6, 0.5);
}
```

## 角色设计

### 1. 卫兵艾尔文 (guard_elvin)
- **颜色**：蓝色系
- **头像**：🛡️
- **特色**：秩序、保护
- **触发词**：安全、保护、秩序、方向

### 2. 祭司莉拉 (priestess_lila)
- **颜色**：紫色系
- **头像**：⛪
- **特色**：信仰、慈悲
- **触发词**：信仰、祈祷、神圣、帮助

### 3. 商人卡尔 (merchant_karl)
- **颜色**：黄色系
- **头像**：💰
- **特色**：商业、利润
- **触发词**：交易、买卖、价格、商品、赚钱

### 4. 水手玛雅 (sailor_maya)
- **颜色**：青色系
- **头像**：⚓
- **特色**：冒险、自由
- **触发词**：大海、航海、船只、冒险、故事

## 响应式设计

### 移动端优化
- 使用 `mobile-optimized` 类调整字体大小和间距
- 使用 `mobile-full-width` 类确保全宽显示
- 触摸友好的按钮尺寸

### 无障碍支持
- 支持 `prefers-reduced-motion` 媒体查询
- 提供焦点样式
- 支持键盘导航

## 字体系统

### 主要字体
- **标题**：Cinzel (衬线字体，营造中世纪感)
- **正文**：Crimson Text (衬线字体，易读性好)

### 字体导入
```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
```

## 自定义滚动条

```css
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #fef3c7;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #d97706;
  border-radius: 4px;
}
```

## 工具提示

```css
.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 0.5rem;
  border-radius: 0.375rem;
  opacity: 0;
  transition: opacity 0.3s;
}
```

## 使用指南

### 1. 启动项目
```bash
cd web
npm run dev
```

### 2. 访问地址
- 开发环境：http://localhost:3000
- 首次访问会跳转到角色创建页面

### 3. 功能说明
- **角色创建**：设置角色名称和目的
- **智能对话**：根据关键词自动选择合适的NPC
- **角色介绍**：点击右上角按钮查看所有角色信息
- **快捷提示**：输入框下方提供常用对话建议

## 技术栈

- **前端框架**：Next.js 15.4.6 + React 19.1.0
- **样式框架**：Tailwind CSS 4
- **字体**：Google Fonts (Cinzel, Crimson Text)
- **动画**：CSS Animations + Tailwind Transitions
- **AI服务**：DeepSeek API

## 未来改进

1. **音效系统**：添加背景音乐和音效
2. **更多角色**：扩展NPC角色库
3. **角色头像**：使用自定义插画替代emoji
4. **主题切换**：支持深色/浅色主题
5. **多语言支持**：国际化支持
6. **移动端优化**：PWA支持
