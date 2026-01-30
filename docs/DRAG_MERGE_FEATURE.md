# 拖拽合并功能文档

## 功能概述

图标宫格现在支持智能拖拽合并功能，可以通过拖拽将多个图标合并成文件夹。

## 核心特性

### 1. 智能拖拽合并

拖拽图标时，系统会根据鼠标位置自动判断是交换位置还是合并：

#### 拖到左侧元素
- **拖到左边缘（左侧33%区域）**：避让交换位置
- **拖到右边缘和中间区域**：
  - 目标元素会高亮显示（蓝色边框脉冲动画）
  - 松开后合并为 "目标 + 拖动" 的文件夹
  - 原拖动元素消失

#### 拖到右侧元素
- **拖到右边缘（右侧33%区域）**：避让交换位置
- **拖到左边缘和中间区域**：
  - 目标元素会高亮显示（蓝色边框脉冲动画）
  - 松开后合并为 "拖动 + 目标" 的文件夹
  - 原拖动元素消失

#### 边缘检测
- 在元素边缘5px范围内不会触发合并
- 确保拖拽体验流畅，避免误操作

### 2. 文件夹功能

#### 创建文件夹
- 将一个图标拖到另一个图标的中间区域
- 等待目标元素高亮（蓝色边框）
- 松开鼠标完成合并
- 自动创建文件夹，使用目标元素的名称

#### 打开文件夹
- 点击文件夹图标
- 弹出对话框显示文件夹内容
- 文件夹内的图标以网格形式展示
- 弹窗使用玻璃态样式（`backdrop-blur-xl bg-primary/20`）

#### 文件夹内拖拽
- 文件夹弹窗内支持拖拽排序
- 文件夹内不支持再次合并（避免嵌套）
- 关闭弹窗自动保存排序

#### 解散文件夹
- 在文件夹弹窗中，将图标拖出只剩一个
- 关闭弹窗时自动解散文件夹
- 剩余的单个图标恢复为普通图标

### 3. 视觉反馈

#### 拖拽状态
- **原位置图标（ghost）**：半透明（opacity: 0.3）
- **拖动中的图标**：保持完全不透明（opacity: 1）

#### 合并高亮
- 蓝色边框（rgba(59, 130, 246, 0.8)）
- 脉冲动画效果
- 边框会随着拖拽实时更新

#### 文件夹弹窗样式
- 玻璃态背景：`backdrop-blur-xl bg-primary/20`
- 边框：`border-2 border-border/50`
- 文字颜色：`text-foreground`
- 关闭按钮：白色，半透明

## 技术实现

### 核心逻辑

1. **onMove 事件处理**
   - 计算鼠标位置与目标元素的相对位置
   - 判断是否在边缘区域（33%阈值）
   - 决定返回值：-1（左移）、1（右移）、false（不移动）、true（默认行为）

2. **onEnd 事件处理**
   - 检查是否处于合并模式
   - 通过 `highlightedElement.dataset.id` 找到真正的目标元素
   - 提取拖拽元素和目标元素的图标
   - 创建新文件夹
   - 更新图标列表（移除两个原始元素，插入新文件夹）

3. **文件夹管理**
   - 使用 Dialog 组件展示文件夹内容
   - 独立的 ReactSortable 实例管理文件夹内拖拽
   - 关闭时同步更新主列表

### 数据结构

```typescript
// 图标项
type IconItem = {
  id: string;
  name: string;
  url: string;
  iconType: "logo" | "image" | "text";
  iconLogo?: string;
  iconImage?: string;
  iconText?: string;
  iconColor?: string;
};

// 文件夹项
type FolderItem = {
  id: string;
  name: string;
  type: "folder";
  items: IconItem[];
};

// 网格项（联合类型）
type GridItem = IconItem | FolderItem;
```

## 使用示例

### 基本使用

```tsx
import { IconGrid } from "@/components/icon-grid";

<IconGrid
  items={gridItems}
  onItemsChange={handleItemsChange}
  openInNewTab={true}
  iconStyle={iconStyleSettings}
/>
```

### 处理文件夹

```typescript
import { isFolder, createFolder } from "@/lib/grid-model";

// 检查是否为文件夹
if (isFolder(item)) {
  console.log("这是一个文件夹", item.items);
}

// 手动创建文件夹
const folder = createFolder([icon1, icon2], "我的文件夹");
```

## 样式定制

### CSS 类

```css
/* 合并高亮 */
.merge-highlight {
  position: relative;
}

.merge-highlight::before {
  content: '';
  position: absolute;
  inset: -4px;
  border: 3px solid rgba(59, 130, 246, 0.8);
  border-radius: 12px;
  pointer-events: none;
  animation: pulse 1s ease-in-out infinite;
}

/* 拖拽状态 */
/* 原位置的幽灵元素（ghost）- 半透明 */
.blue-background-class {
  opacity: 0.3 !important;
}

/* 正在拖拽的元素 - 保持完全不透明 */
.dragging-element {
  opacity: 1 !important;
}
```

## 调试

### 控制台日志

合并操作会输出详细的调试信息：

```
🔄 合并操作: {
  draggedItem: "图标A",
  targetItem: "图标B",
  draggedIndex: 0,
  targetIndex: 1,
  mergePosition: "after"
}

📦 提取的图标: {
  draggedIcons: ["图标A"],
  targetIcons: ["图标B"]
}

✅ 创建文件夹: {
  folderName: "图标B",
  itemCount: 2,
  items: ["图标B", "图标A"]
}

📋 更新后的列表: {
  原始数量: 10,
  新数量: 9,
  items: [...]
}
```

## 注意事项

1. **性能优化**
   - 使用 `useRef` 存储合并状态，避免不必要的重渲染
   - 文件夹弹窗使用独立的状态管理

2. **边界情况**
   - 文件夹内不支持再次合并
   - 只剩一个图标时自动解散文件夹
   - 边缘5px范围内不触发合并

3. **兼容性**
   - 支持触摸设备
   - 支持键盘操作（ESC关闭弹窗）
   - 支持点击弹窗外部关闭

4. **样式一致性**
   - 遵循项目设计系统（玻璃态、圆角、阴影）
   - 文字颜色使用 `text-foreground` 变量
   - 背景使用 `bg-primary/20` 变量

## 已修复的问题

### 2024-01-30 修复

1. ✅ **拖拽透明度问题**
   - 原位置图标变透明（opacity: 0.3）
   - 拖动的图标保持不透明（opacity: 1）

2. ✅ **合并逻辑错误**
   - 修复了使用 `evt.newIndex` 导致的目标元素错误
   - 现在通过 `highlightedElement.dataset.id` 正确找到目标元素
   - 确保两个图标都被移除，只创建一个文件夹

3. ✅ **文件夹弹窗样式问题**
   - 添加玻璃态背景（`backdrop-blur-xl bg-primary/20`）
   - 添加边框（`border-2 border-border/50`）
   - 修复文字颜色（`text-foreground`）
   - 修复关闭按钮颜色

## 未来改进

- [ ] 支持文件夹重命名
- [ ] 支持文件夹嵌套
- [ ] 支持拖拽图标到文件夹外
- [ ] 支持文件夹自定义图标
- [ ] 支持批量选择和合并
