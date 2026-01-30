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

#### 文件夹内拖拽
- 文件夹弹窗内支持拖拽排序
- 文件夹内不支持再次合并（避免嵌套）
- 关闭弹窗自动保存排序

#### 解散文件夹
- 在文件夹弹窗中，将图标拖出只剩一个
- 关闭弹窗时自动解散文件夹
- 剩余的单个图标恢复为普通图标

### 3. 视觉反馈

#### 合并高亮
- 蓝色边框（rgba(59, 130, 246, 0.8)）
- 脉冲动画效果
- 边框会随着拖拽实时更新

#### 拖拽状态
- 拖拽中的元素：半透明（opacity: 0.8）+ 轻微放大（scale: 1.05）
- 幽灵元素：半透明（opacity: 0.5）

## 技术实现

### 核心逻辑

1. **onMove 事件处理**
   - 计算鼠标位置与目标元素的相对位置
   - 判断是否在边缘区域（33%阈值）
   - 决定返回值：-1（左移）、1（右移）、false（不移动）、true（默认行为）

2. **onEnd 事件处理**
   - 检查是否处于合并模式
   - 提取拖拽元素和目标元素的图标
   - 创建新文件夹
   - 更新图标列表

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
.blue-background-class {
  opacity: 0.5;
}

.dragging-element {
  opacity: 0.8;
  transform: scale(1.05);
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

## 未来改进

- [ ] 支持文件夹重命名
- [ ] 支持文件夹嵌套
- [ ] 支持拖拽图标到文件夹外
- [ ] 支持文件夹自定义图标
- [ ] 支持批量选择和合并
