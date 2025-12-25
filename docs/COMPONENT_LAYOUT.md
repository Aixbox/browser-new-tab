# 组件模式布局说明

## 布局结构

组件模式采用顶部固定、底部滚动的布局方式：

```
┌─────────────────────────────────────────┐
│ [侧边栏]  ┌─────────────────────────┐  │
│   头像    │      时间显示            │  │
│   按钮    │      搜索框              │  │
│   按钮    ├─────────────────────────┤  │
│   按钮    │                          │  │
│          │   图标网格（可滚动）      │  │
│          │   [图标] [图标] [图标]   │  │
│          │   [图标] [图标] [图标]   │  │
│          │   [图标] [图标] [图标]   │  │
│          │   ...                    │  │
│          └─────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 区域划分

### 1. 侧边栏（固定）
- 宽度：56px (14 * 4px)
- 位置：左侧固定
- 内容：头像、导航按钮

### 2. 顶部区域（固定）
- 内容：时间显示 + 搜索框
- 垂直居中对齐
- 间距：gap-6 (24px)
- 内边距：pt-12 pb-8

### 3. 图标网格区域（可滚动）
- 最大宽度：1500px
- 自动居中
- 可垂直滚动
- 响应式布局

## 响应式设计

### 图标网格

使用 CSS Grid 的 `auto-fill` 实现响应式布局：

```css
grid-cols-[repeat(auto-fill,minmax(100px,1fr))]
```

**特点：**
- 每个图标最小宽度 100px
- 自动计算每行可以放多少个图标
- 图标数量超过一行时自动换行
- 窗口缩小时自动调整列数

**响应式行为：**
- 宽度 ≥ 1500px：显示最多约 14 列
- 宽度 1200px：显示约 11 列
- 宽度 900px：显示约 8 列
- 宽度 600px：显示约 5 列
- 宽度 < 400px：显示约 3 列

### 容器宽度

```tsx
<div className="w-full max-w-[1500px]">
  <DraggableGrid />
</div>
```

- 默认最大宽度 1500px
- 窗口小于 1500px 时，宽度为 100%
- 自动居中显示

## 布局代码

### 主布局结构

```tsx
<div className="h-full w-full relative pl-16 flex flex-col">
  {/* 顶部区域：时间和搜索框 */}
  <div className="flex-shrink-0 flex flex-col items-center justify-center pt-12 pb-8 gap-6">
    <SimpleTimeDisplay />
    <SearchEngine openInNewTab={openInNewTab.search} />
  </div>
  
  {/* 图标网格区域 */}
  <div className="flex-1 overflow-y-auto flex justify-center px-8 pb-8">
    <div className="w-full max-w-[1500px]">
      <DraggableGrid openInNewTab={openInNewTab.icon} />
    </div>
  </div>
</div>
```

### 关键 CSS 类说明

**主容器：**
- `h-full w-full` - 占满父容器
- `relative` - 相对定位
- `pl-16` - 左侧留出侧边栏空间（64px）
- `flex flex-col` - 垂直 Flexbox 布局

**顶部区域：**
- `flex-shrink-0` - 不允许收缩，保持固定高度
- `flex flex-col items-center justify-center` - 垂直居中
- `pt-12 pb-8` - 上下内边距
- `gap-6` - 子元素间距 24px

**网格区域：**
- `flex-1` - 占据剩余空间
- `overflow-y-auto` - 垂直滚动
- `flex justify-center` - 水平居中
- `px-8 pb-8` - 左右和底部内边距

## 滚动行为

### 滚动区域

只有图标网格区域可以滚动，顶部的时间和搜索框保持固定。

### 滚动条样式

可以通过 Tailwind 自定义滚动条样式：

```css
/* 隐藏滚动条但保持滚动功能 */
[&::-webkit-scrollbar]:hidden
[-ms-overflow-style:none]
[scrollbar-width:none]
```

或者自定义滚动条样式：

```css
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
```

## 优势

### 1. 固定顶部
- 时间和搜索框始终可见
- 不需要滚动就能搜索
- 更好的用户体验

### 2. 响应式网格
- 自动适应窗口大小
- 不会出现横向滚动条
- 图标大小保持一致

### 3. 最大宽度限制
- 在大屏幕上不会过于分散
- 保持视觉聚焦
- 更好的可读性

### 4. 可滚动内容
- 支持大量图标
- 不会挤压其他元素
- 流畅的滚动体验

## 与极简模式对比

| 特性 | 组件模式 | 极简模式 |
|------|---------|---------|
| 侧边栏 | ✓ 显示 | ✗ 隐藏 |
| 时间位置 | 顶部固定 | 垂直居中 |
| 搜索框位置 | 顶部固定 | 垂直居中 |
| 图标网格 | ✓ 显示（可滚动） | ✗ 隐藏 |
| 布局方式 | 顶部固定 + 底部滚动 | 完全居中 |
| 最大宽度 | 1500px | 无限制 |

## 未来改进

1. **自定义网格宽度**
   - 允许用户设置最大宽度
   - 保存到 KV 存储

2. **自定义图标大小**
   - 小、中、大三种尺寸
   - 影响每行显示的图标数量

3. **网格间距调整**
   - 紧凑、正常、宽松
   - 适应不同使用习惯

4. **顶部区域自定义**
   - 允许隐藏时间或搜索框
   - 调整顺序

5. **滚动优化**
   - 虚拟滚动（大量图标时）
   - 平滑滚动动画
   - 滚动到顶部按钮
