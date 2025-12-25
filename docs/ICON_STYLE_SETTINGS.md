# 图标样式设置功能

## 功能概述

用户可以在设置中自定义图标的外观样式，包括大小、圆角和不透明度，调整会实时应用到页面图标。

## 设置位置

**路径：** 设置 → 图标

## 可调整的样式

### 1. 图标大小
- **范围：** 50px - 100px
- **默认值：** 80px
- **说明：** 控制图标的宽度和高度

### 2. 图标圆角
- **范围：** 0px - 图标大小的一半
- **默认值：** 12px
- **说明：** 
  - 0px = 完全方形
  - 图标大小的一半 = 完全圆形
  - 圆角最大值随图标大小动态调整

### 3. 不透明度
- **范围：** 1% - 100%
- **默认值：** 100%
- **说明：** 控制图标的透明度

## 特殊的 UI 体验

### 对话框位置变化

当用户进入图标设置页面时：

**普通设置页面：**
- 位置：屏幕中央
- 背景：有模糊遮罩
- 点击外部：关闭对话框

**图标设置页面：**
- 位置：右下角（bottom-8 right-8）
- 背景：无遮罩，可以看到页面内容
- 点击外部：不关闭对话框
- 目的：方便用户实时查看图标变化

### 平滑过渡

切换到图标设置时，对话框会平滑移动到右下角：

```tsx
className={cn(
  "fixed w-[800px] h-[600px] transition-all duration-300",
  isIconSettings 
    ? "bottom-8 right-8" 
    : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
)}
```

## 实时预览机制

### 数据流程

```
用户拖动滑块
    ↓
handleStyleChange() 触发
    ↓
更新本地状态 setIconStyle()
    ↓
触发 CustomEvent 'iconStyleChanged'
    ↓
保存到 KV (setSetting)
    ↓
页面监听事件
    ↓
更新 currentIconStyle 状态
    ↓
传递给 DraggableGrid
    ↓
应用到每个图标
```

### 事件通信

**发送事件（IconSettings）：**
```typescript
const handleStyleChange = async (key: keyof IconStyleSettings, value: number) => {
  const newStyle = { ...iconStyle, [key]: value };
  setIconStyle(newStyle);
  
  // 立即触发事件更新页面
  window.dispatchEvent(new CustomEvent('iconStyleChanged', { 
    detail: newStyle 
  }));

  // 保存到 KV
  await setSetting('icon_style', JSON.stringify(newStyle));
};
```

**监听事件（Home）：**
```typescript
useEffect(() => {
  const handleIconStyleChange = (e: CustomEvent) => {
    if (e.detail) {
      setCurrentIconStyle(e.detail);
    }
  };
  
  window.addEventListener('iconStyleChanged', handleIconStyleChange);
  return () => window.removeEventListener('iconStyleChanged', handleIconStyleChange);
}, []);
```

## 样式应用

### 动态样式计算

```typescript
const renderIcon = () => {
  const iconSize = iconStyle?.size || 80;
  const borderRadius = iconStyle?.borderRadius || 12;
  const opacity = (iconStyle?.opacity || 100) / 100;

  const iconStyle_css = {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    borderRadius: `${borderRadius}px`,
    opacity: opacity,
  };

  return <div style={iconStyle_css}>...</div>;
};
```

### 平滑过渡

所有图标都添加了过渡动画：

```tsx
className="transition-all duration-200"
```

这确保样式变化时有平滑的动画效果。

## 数据存储

### KV 存储格式

**Key:** `icon_style`

**Value:** JSON 字符串
```json
{
  "size": 80,
  "borderRadius": 12,
  "opacity": 100
}
```

### 默认值

如果 KV 中没有存储该设置，使用默认值：
```typescript
{
  size: 80,
  borderRadius: 12,
  opacity: 100
}
```

## 滑块样式

### 自定义滑块

使用自定义 CSS 样式美化滑块：

```css
input[type="range"].slider::-webkit-slider-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

input[type="range"].slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}
```

### 渐变进度条

滑块轨道使用渐变背景显示当前进度：

```tsx
style={{
  background: `linear-gradient(to right, 
    rgb(59 130 246) 0%, 
    rgb(59 130 246) ${progress}%, 
    rgba(255,255,255,0.2) ${progress}%, 
    rgba(255,255,255,0.2) 100%)`
}}
```

## 用户体验优化

### 1. 实时反馈
- 拖动滑块时立即看到效果
- 无需点击"保存"按钮
- 自动保存到 KV

### 2. 数值显示
- 每个滑块旁边显示当前数值
- 滑块两端显示最小/最大值说明

### 3. 视觉提示
- 滑块悬停时放大
- 渐变进度条显示当前位置
- 蓝色提示框说明功能

### 4. 无遮挡预览
- 对话框移到右下角
- 移除背景模糊
- 用户可以清楚看到页面图标变化

## 技术特点

### 1. 响应式约束

圆角最大值随图标大小动态调整：

```tsx
<input
  type="range"
  min="0"
  max={Math.floor(iconStyle.size / 2)}
  value={iconStyle.borderRadius}
/>
```

当图标大小改变时，圆角的最大值也会相应调整。

### 2. 性能优化

- 使用 CSS transitions 而不是 JavaScript 动画
- 事件驱动的更新机制
- 只更新必要的组件

### 3. 类型安全

```typescript
export interface IconStyleSettings {
  size: number;
  borderRadius: number;
  opacity: number;
}
```

使用 TypeScript 接口确保类型安全。

## 文件修改清单

### 新增文件
1. `components/icon-settings.tsx`
   - 图标样式设置组件
   - 三个滑块控制器
   - 实时更新逻辑

### 修改文件
1. `components/settings-drawer.tsx`
   - 添加图标设置标签页
   - 实现对话框位置切换
   - 条件渲染背景遮罩

2. `pages/index.tsx`
   - 从 KV 读取图标样式
   - 监听样式变化事件
   - 传递样式给 DraggableGrid

3. `components/draggable-grid.tsx`
   - 接收 iconStyle prop
   - 应用动态样式到图标
   - 支持所有图标类型

4. `styles/globals.css`
   - 添加自定义滑块样式
   - 悬停效果

## 未来改进

1. **更多样式选项**
   - 阴影效果
   - 边框样式
   - 背景模糊

2. **预设方案**
   - 保存多个样式预设
   - 快速切换

3. **动画效果**
   - 悬停动画
   - 点击动画
   - 自定义过渡时间

4. **批量应用**
   - 只应用到特定类型的图标
   - 分组管理图标样式
