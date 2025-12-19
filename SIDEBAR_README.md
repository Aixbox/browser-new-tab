# 自定义侧边栏组件

## 功能特性

- ✨ 现代化设计，符合项目整体风格
- 🎯 图标 + 标题的垂直布局
- ➕ 支持动态添加/删除按钮
- 🎨 8种内置图标可选择
- 💫 流畅的动画效果
- 📱 响应式设计

## 使用方法

### 基础使用

```tsx
import { CustomSidebar } from "@/components/custom-sidebar";

export default function MyPage() {
  return (
    <div>
      <CustomSidebar />
      {/* 其他内容 */}
    </div>
  );
}
```

### 自定义按钮和交互

```tsx
import { CustomSidebar, type SidebarItem } from "@/components/custom-sidebar";
import { toast } from "sonner";

export default function MyPage() {
  const [items, setItems] = useState<SidebarItem[]>([
    { 
      id: "1", 
      title: "首页", 
      icon: "home",
      onClick: () => router.push("/")
    },
    { 
      id: "2", 
      title: "设置", 
      icon: "settings",
      onClick: () => toast.success("打开设置页面")
    },
  ]);

  return (
    <CustomSidebar 
      items={items} 
      onItemsChange={setItems}
    />
  );
}
```

## 可用图标

- `home` - 首页
- `settings` - 设置
- `profile` - 个人资料
- `search` - 搜索
- `email` - 邮件
- `calendar` - 日历
- `document` - 文档
- `heart` - 收藏

## 组件属性

### CustomSidebar Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `items` | `SidebarItem[]` | 默认按钮 | 侧边栏按钮列表 |
| `onItemsChange` | `(items: SidebarItem[]) => void` | - | 按钮列表变化回调 |
| `className` | `string` | - | 自定义样式类名 |

### SidebarItem 接口

```tsx
interface SidebarItem {
  id: string;                    // 唯一标识符
  title: string;                 // 按钮标题
  icon: keyof typeof availableIcons; // 图标类型
  onClick?: () => void;          // 点击回调函数
}
```

## 交互功能

1. **添加按钮**: 点击底部的 "+" 按钮打开添加对话框
2. **删除按钮**: 悬停在按钮上显示删除按钮（右上角红色 X）
3. **点击响应**: 每个按钮都可以绑定自定义点击事件

## 样式定制

侧边栏使用了项目的设计系统，包括：
- 毛玻璃效果背景
- 一致的边框和阴影
- 流畅的动画过渡
- 响应式布局

如需自定义样式，可以通过 `className` 属性传入额外的 CSS 类。

## 注意事项

1. 确保在布局中为侧边栏预留足够的空间（宽度约 80px）
2. 建议在主内容区域添加 `pl-24` 类来避免内容被遮挡
3. 需要安装 `sonner` 包来支持 toast 通知功能