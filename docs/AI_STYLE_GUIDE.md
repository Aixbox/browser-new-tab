# AI 样式修改示例

本示例演示如何使用设计系统指南让 AI 保持一致的样式风格。

## 🎯 示例场景：创建一个通知卡片组件

### 原始需求
```
用户说：我需要一个通知卡片，显示消息标题和内容，有关闭按钮。
```

### ❌ 错误的 AI 提示（不遵循设计系统）
```
请帮我创建一个通知卡片组件，包含标题、内容和关闭按钮。
```

**AI 可能的错误回复：**
```tsx
// ❌ 不符合设计系统的样式
const NotificationCard = ({ title, content, onClose }) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-gray-600 mt-1">{content}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 ml-4"
        >
          ×
        </button>
      </div>
    </div>
  );
};
```

### ✅ 正确的 AI 提示（遵循设计系统）

````markdown
请创建一个通知卡片组件，严格按照以下设计系统规范：

## 设计风格要求
- **玻璃态美学**: 使用 `backdrop-blur-xl`、`bg-primary/20`、`border-border/50` 创建毛玻璃效果
- **圆角系统**: 卡片用 `rounded-3xl`
- **阴影系统**: 使用自定义 `shadow-button` 和多层 `ring-1 ring-offset-2` 效果
- **间距系统**: 内边距用 `p-6`，组件间距用 `gap-4`

## 字体排版规范
- **标题**: `text-base font-medium text-foreground` （不要用太大的字号）
- **正文**: `text-sm text-foreground`
- **行高**: 使用 `leading-[1.1]!` 紧凑行高

## 色彩变量使用
- 文字: `text-foreground`
- 背景: `bg-primary/20`
- 边框: `border-border/50`
- 按钮: 使用 iconButton 变体

## 组件要求
- 包含标题、内容文本、关闭按钮
- 关闭按钮使用 iconButton 样式
- 整体布局使用 flex

请提供完整的 TypeScript 组件代码。
````

**AI 正确回复：**
```tsx
import { Cross1Icon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  title: string;
  content: string;
  onClose: () => void;
  className?: string;
}

const NotificationCard = ({ title, content, onClose, className }: NotificationCardProps) => {
  return (
    <div
      className={cn(
        // 玻璃态效果
        "backdrop-blur-xl",
        "bg-primary/20",
        "border-2 border-border/50",

        // 圆角和阴影
        "rounded-3xl",
        "ring-1 ring-offset-primary/10 ring-border/10 ring-offset-2",
        "shadow-button",

        // 布局
        "flex items-start justify-between",
        "p-6 gap-4",

        className
      )}
    >
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <h3 className="text-base font-medium text-foreground leading-[1.1]!">
          {title}
        </h3>
        <p className="text-sm text-foreground text-pretty">
          {content}
        </p>
      </div>

      <button
        onClick={onClose}
        className={cn(
          // iconButton 样式
          "inline-flex items-center justify-center",
          "border border-border/50 hover:border-border/15",
          "bg-primary hover:bg-primary",
          "backdrop-blur-xs",
          "text-primary-foreground",
          "ring-1 ring-offset-2",
          "shadow-button hover:shadow-button-hover",
          "rounded-full size-9",
          "transition-colors-and-shadows duration-300 ease-out",
          "shrink-0"
        )}
      >
        <Cross1Icon className="size-4" />
      </button>
    </div>
  );
};

export default NotificationCard;
```

## 🔄 更复杂的示例：修改现有组件

### 场景：用户想要修改现有的表单组件

**用户提供的原始组件：**
```tsx
// 用户的原始代码（不符合设计系统）
const ContactForm = () => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Contact Us</h2>
      <form>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Send Message
        </button>
      </form>
    </div>
  );
};
```

### ✅ 正确的修改提示

````markdown
请将以下表单组件修改为符合我们设计系统的风格：

[粘贴用户的原始代码]

## 修改要求（严格按照设计系统）

### 容器样式
- 替换 `bg-white rounded-lg shadow-lg` 为玻璃态效果：
  - `backdrop-blur-xl bg-primary/20 border-2 border-border/50`
  - `rounded-3xl ring-1 ring-offset-primary/10 ring-border/10 ring-offset-2 shadow-button`

### 标题样式
- 使用设计系统字体：`font-serif text-5xl italic text-foreground`
- 如果太大可用：`text-2xl font-medium text-foreground`

### 输入框样式
- 使用 inputVariants 样式系统：
  - `rounded-full bg-primary/20 border-2 border-white/50`
  - `backdrop-blur-xs focus-visible:ring-1 focus-visible:ring-primary/40`
  - `text-white placeholder:text-white/80 px-4 h-11`

### 按钮样式
- 使用 buttonVariants default 样式：
  - `rounded-full bg-primary/20 hover:bg-primary/30 backdrop-blur-xs`
  - `border border-border/50 hover:border-border/15`
  - `shadow-button hover:shadow-button-hover`
  - `transition-colors-and-shadows duration-300 ease-out`

### 间距调整
- 容器内边距：`p-6`
- 表单元素间距：`gap-4 gap-6`
- 标签文字：`text-sm text-foreground`

请提供修改后的完整代码，确保所有样式都符合设计系统规范。
````

## 📋 常用提示词模板

### 1. 创建新组件模板
```markdown
请创建一个 [组件类型] 组件，严格遵循设计系统：

**必须使用的样式模式：**
- 玻璃态：`backdrop-blur-xl bg-primary/20 border-2 border-border/50`
- 圆角：`rounded-3xl`（卡片）或 `rounded-full`（按钮/输入）
- 阴影：`shadow-button ring-1 ring-offset-2 ring-border/10`
- 字体：主标题用 `font-serif italic`，正文用 `text-foreground`
- 间距：`p-6 gap-4 gap-6`

**功能需求：** [具体需求描述]
```

### 2. 修改现有组件模板
```markdown
请将以下组件改造为符合设计系统风格：

[粘贴原始代码]

**必须替换的样式：**
- 所有白色背景 → `backdrop-blur-xl bg-primary/20`
- 所有灰色边框 → `border-2 border-border/50`
- 所有标准圆角 → `rounded-3xl` 或 `rounded-full`
- 所有标准阴影 → `shadow-button`
- 所有颜色值 → 使用设计系统变量

保持原有功能不变，只修改样式。
```

### 3. 响应式优化模板
```markdown
请为以下组件添加响应式支持，使用设计系统的响应式规范：

[粘贴代码]

**响应式要求：**
- 支持 `short:lg:` 断点（矮屏幕适配）
- 字号使用：`text-base short:lg:text-lg sm:text-lg lg:text-xl`
- 间距使用：`gap-4 short:lg:gap-4 lg:gap-8`
- 边距使用：`pt-10 short:lg:pt-10`
```

通过这些详细的提示词和示例，AI 就能够准确理解并保持项目的设计风格一致性。