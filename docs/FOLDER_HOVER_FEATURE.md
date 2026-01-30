# 文件夹悬停打开功能

## 功能概述

实现了智能的文件夹悬停打开和弹窗遮罩悬停关闭功能，允许用户通过拖拽在外部网格和文件夹之间无缝移动图标。

## 核心特性

### 1. 外部网格 → 文件夹（悬停打开）

#### 触发条件
- 拖动图标到文件夹图标的**中间区域**
- 悬停**1秒**
- 自动打开文件夹弹窗

#### 工作流程
```
1. 用户拖动图标 A
2. 移动到文件夹图标上（中间区域）
3. 等待 1 秒（计时器开始）
4. 文件夹弹窗自动打开
5. 用户可以将图标 A 拖入弹窗内
6. 松开鼠标，图标 A 添加到文件夹
```

#### 视觉反馈
- 悬停在文件夹上时，**不显示合并高亮**
- 1秒后弹窗自动打开
- 控制台输出：`🗂️ 打开文件夹: [文件夹名称]`

### 2. 文件夹弹窗 → 外部网格（悬停关闭）

#### 触发条件
- 在文件夹弹窗打开时
- 拖动图标到**弹窗遮罩区域**（DialogContent 外部的黑色半透明区域）
- 悬停**1秒**
- 自动关闭文件夹弹窗

#### 工作流程
```
1. 文件夹弹窗已打开
2. 用户拖动图标 B
3. 移动到遮罩区域（弹窗外部）
4. 等待 1 秒（计时器开始）
5. 文件夹弹窗自动关闭
6. 用户可以将图标 B 拖入外部网格
7. 松开鼠标，图标 B 添加到外部网格
```

#### 视觉反馈
- 鼠标进入遮罩区域时，计时器开始
- 鼠标返回弹窗内容区域时，计时器取消
- 1秒后弹窗自动关闭
- 控制台输出：`🚪 关闭文件夹弹窗`

## 技术实现

### 1. 状态管理

```typescript
// 文件夹悬停状态
const folderHoverStateRef = useRef({
  hoveredFolder: null as GridItem | null,     // 当前悬停的文件夹
  hoverStartTime: null as number | null,      // 悬停开始时间
  hoverTimer: null as NodeJS.Timeout | null,  // 定时器
});

// 弹窗遮罩悬停状态
const overlayHoverStateRef = useRef({
  isHovering: false,                          // 是否悬停在遮罩上
  hoverStartTime: null as number | null,      // 悬停开始时间
  hoverTimer: null as NodeJS.Timeout | null,  // 定时器
});
```

### 2. 文件夹悬停检测（handleSortableMove）

```typescript
// 检查是否悬停在文件夹上
const targetItem = items.find(item => item.id === targetId);

if (targetItem && isFolder(targetItem)) {
  // 悬停在文件夹上
  if (folderHoverStateRef.current.hoveredFolder?.id !== targetItem.id) {
    // 切换到新文件夹，重置计时器
    if (folderHoverStateRef.current.hoverTimer) {
      clearTimeout(folderHoverStateRef.current.hoverTimer);
    }
    
    folderHoverStateRef.current.hoveredFolder = targetItem;
    folderHoverStateRef.current.hoverStartTime = Date.now();
    
    // 设置1秒后打开文件夹
    folderHoverStateRef.current.hoverTimer = setTimeout(() => {
      console.log('🗂️ 打开文件夹:', targetItem.name);
      handleFolderClick(targetItem);
    }, 1000);
  }
  
  // 不触发合并
  return false;
}
```

### 3. 遮罩悬停检测（Dialog Overlay）

```typescript
<div
  className="fixed inset-0 z-50 bg-black/80"
  onMouseEnter={() => {
    // 鼠标进入遮罩区域
    overlayHoverStateRef.current.isHovering = true;
    overlayHoverStateRef.current.hoverStartTime = Date.now();
    
    // 设置1秒后关闭弹窗
    overlayHoverStateRef.current.hoverTimer = setTimeout(() => {
      console.log('🚪 关闭文件夹弹窗');
      handleCloseFolderModal();
    }, 1000);
  }}
  onMouseLeave={() => {
    // 鼠标离开遮罩区域，取消定时器
    if (overlayHoverStateRef.current.hoverTimer) {
      clearTimeout(overlayHoverStateRef.current.hoverTimer);
    }
    overlayHoverStateRef.current.isHovering = false;
  }}
/>
```

### 4. 定时器清理

```typescript
useEffect(() => {
  return () => {
    // 组件卸载时清理定时器
    if (folderHoverStateRef.current.hoverTimer) {
      clearTimeout(folderHoverStateRef.current.hoverTimer);
    }
    if (overlayHoverStateRef.current.hoverTimer) {
      clearTimeout(overlayHoverStateRef.current.hoverTimer);
    }
  };
}, []);
```

## 交互逻辑

### 场景 1：拖动到文件夹

```
用户操作                    系统响应
─────────────────────────────────────────────
拖动图标 A                  开始拖拽
↓
移动到文件夹图标            检测目标类型
↓
悬停在中间区域              启动计时器（1秒）
↓
保持悬停 1 秒               打开文件夹弹窗
↓
拖入弹窗内                  显示插入位置
↓
松开鼠标                    图标 A 添加到文件夹
```

### 场景 2：从文件夹拖出

```
用户操作                    系统响应
─────────────────────────────────────────────
打开文件夹弹窗              显示文件夹内容
↓
拖动图标 B                  开始拖拽
↓
移动到遮罩区域              启动计时器（1秒）
↓
保持悬停 1 秒               关闭文件夹弹窗
↓
拖入外部网格                显示插入位置
↓
松开鼠标                    图标 B 添加到外部网格
```

### 场景 3：取消操作

```
用户操作                    系统响应
─────────────────────────────────────────────
拖动到文件夹                启动计时器
↓
移开（< 1秒）               取消计时器
↓
拖到其他位置                执行普通排序/合并
```

## 边界情况处理

### 1. 切换文件夹
- 从文件夹 A 移动到文件夹 B
- 自动取消文件夹 A 的计时器
- 重新开始文件夹 B 的计时器

### 2. 拖到边缘
- 拖到文件夹的边缘区域（33%）
- 不触发悬停打开
- 执行普通的位置交换

### 3. 拖到普通图标
- 拖到普通图标的中间区域
- 不触发悬停打开
- 执行合并逻辑（显示蓝色高亮）

### 4. 鼠标返回弹窗
- 从遮罩区域返回弹窗内容区域
- 自动取消关闭计时器
- 弹窗保持打开

## 配置参数

### 悬停时间
```typescript
// 文件夹悬停打开时间：1000ms (1秒)
setTimeout(() => {
  handleFolderClick(targetItem);
}, 1000);

// 遮罩悬停关闭时间：1000ms (1秒)
setTimeout(() => {
  handleCloseFolderModal();
}, 1000);
```

### 区域检测
```typescript
// 文件夹中间区域：不在边缘33%和边缘5px范围内
const leftZone = relatedLeft + relatedWidth * 0.33;
const rightZone = relatedRight - relatedWidth * 0.33;
const edgeThreshold = 5;
```

## 调试信息

### 控制台日志

```javascript
// 打开文件夹
🗂️ 打开文件夹: [文件夹名称]

// 关闭文件夹
🚪 关闭文件夹弹窗

// 合并操作（不会在文件夹上触发）
🔄 合并操作: { draggedItem, targetItem, ... }
```

## 注意事项

### 1. 性能优化
- 使用 `useRef` 存储状态，避免重渲染
- 及时清理定时器，防止内存泄漏
- 切换目标时重置计时器

### 2. 用户体验
- 1秒的延迟足够用户判断意图
- 可以通过移开鼠标取消操作
- 视觉反馈清晰（控制台日志）

### 3. 兼容性
- 支持鼠标操作
- 支持触摸设备（通过 Sortable.js）
- 支持键盘操作（ESC 关闭弹窗）

## 未来改进

- [ ] 添加悬停进度指示器（圆形进度条）
- [ ] 支持自定义悬停时间
- [ ] 添加音效反馈
- [ ] 支持拖拽预览动画
- [ ] 优化触摸设备体验
