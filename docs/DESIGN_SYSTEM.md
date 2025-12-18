# Newsletter Template 设计系统文档

本文档详细描述了项目的设计系统，包括自定义变量配置和 Tailwind CSS 类的使用规范。

## 📋 目录
- [自定义变量配置](#自定义变量配置)
- [Tailwind CSS 类分类](#tailwind-css-类分类)
- [AI 样式修改指南](#ai-样式修改指南)
- [组件示例](#组件示例)

## 🎨 自定义变量配置

### tailwind.config.js 自定义变量

```javascript
module.exports = {
  theme: {
    extend: {
      // 响应式断点
      screens: {
        short: { raw: "(max-height: 748px)" }  // 矮屏幕适配
      },

      // 自定义间距
      spacing: {
        inset: "var(--inset)",                // 页面内边距
        sides: "var(--sides)",               // 侧边距
        "footer-safe-area": "var(--footer-safe-area)"  // 底部安全区域
      },

      // 自定义背景渐变
      backgroundImage: {
        "gradient-primary": "linear-gradient(90deg,rgba(255,255,255, 0.1) 0%,rgba(255,255,255, 0.4) 100%),rgba(85,85,85,0.1)"
      },

      // 动画
      animation: {
        shine: "shine 2s ease-in-out infinite"  // 闪光动画
      },

      // 字体
      fontFamily: {
        serif: ["var(--font-instrument-serif)", "serif"]  // 衬线字体
      },

      // 阴影系统
      boxShadow: {
        button: "inset 0 0 1px 1px rgba(255, 255, 255, 0.05), inset 0 0 2px 1px rgba(255, 255, 255, 0.2), inset -1px -1px 1px 0px rgba(0, 0, 0, 0.0), 0 0 10px 0 rgba(255, 255, 255, 0.1)",
        "button-hover": "inset 0 0 5px 1px rgba(255, 255, 255, 0.2), inset 0.5px 0.5px 1px 0.5px rgba(255, 255, 255, 0.5), inset -0.5px -0.5px 0.5px 0.5px rgba(0, 0, 0, 0.2), 0 0 12px 4px rgba(255, 255, 255, 0.5)"
      },

      // 过渡属性
      transitionProperty: {
        "colors-and-shadows": "color, background-color, border-color, text-decoration-color, fill, stroke, box-shadow"
      }
    }
  }
}
```

### globals.css 自定义CSS变量

```css
:root {
  /* 间距变量 */
  --inset: min(2vw, 1.5rem);
  --sides: 1rem;
  --footer-safe-area: calc(var(--inset) * 2 + 1.5rem + theme('spacing.9'));

  /* 颜色变量 (HSL格式) */
  --background: 0 0% 100%;        /* 页面背景 */
  --foreground: 0 0% 98%;         /* 文字颜色 */
  --primary: 0 0% 98%;            /* 主色 */
  --primary-foreground: 0 0% 9%;  /* 主色文字 */
  --border: 0 0% 98%;             /* 边框 */
  --input: 0 0% 89.8%;           /* 输入框 */
  --ring: 0 0% 3.9%;             /* 聚焦环 */
  --radius: 0.5rem;              /* 圆角半径 */
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  :root {
    --background: 240 2% 8%;      /* 深色背景 */
  }
}

/* 闪光动画关键帧 */
@keyframes shine {
  0% { transform: translateX(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(200%); opacity: 0; }
}
```

## 🎯 Tailwind CSS 类分类

### 🏗️ 布局与结构类

#### 页面主容器
```css
/* 页面根容器 */
p-inset                 /* 自定义页面内边距 var(--inset) */
h-dvh              /* 动态视窗高度 */
w-full                  /* 全宽 */

/* 相对定位容器 */
relative                /* 相对定位 */
h-full w-full          /* 继承父容器尺寸 */
```

#### Flexbox 布局
```css
/* 主内容区域 */
flex                    /* 启用 flexbox */
flex-col                /* 垂直方向 */
overflow-hidden         /* 隐藏溢出 */
relative                /* 相对定位 */
justify-center          /* 垂直居中 */
items-center            /* 水平居中 */

/* 子容器 */
flex flex-col items-center min-h-0 shrink
```

#### 间距系统
```css
/* 自定义间距变量使用 */
pt-10                   /* 标准顶部间距 */
px-sides                /* 自定义侧边距 var(--sides) */
pb-footer-safe-area     /* 自定义底部安全区域 var(--footer-safe-area) */

/* 标准间距 */
gap-4                   /* 16px 间距 */
gap-6                   /* 24px 间距 */
gap-8                   /* 32px 间距 */
p-6                     /* 24px 内边距 */
```

### 🎨 视觉效果类

#### 圆角系统
```css
/* 背景视频/图片 */
rounded-[42px]          /* 42px 圆角 */
md:rounded-[72px]       /* 中等屏幕 72px 圆角 */

/* 卡片容器 */
rounded-3xl             /* 24px 圆角 */

/* 按钮输入框 */
rounded-full            /* 完全圆角 */
```

#### 玻璃态效果
```css
/* 毛玻璃背景 */
backdrop-blur-xl        /* 强烈毛玻璃效果 */
backdrop-blur-xs        /* 轻度毛玻璃效果 */

/* 半透明背景 */
bg-primary/20           /* 主色 20% 透明度 */
bg-background           /* 背景色变量 */

/* 边框效果 */
border-2                /* 2px 边框 */
border-border/50        /* 边框色 50% 透明度 */
```

#### 阴影与光效
```css
/* 自定义按钮阴影 */
shadow-button           /* 自定义按钮阴影效果 */

/* 多层环效果 */
ring-1                  /* 1px 环 */
ring-offset-2           /* 2px 环偏移 */
ring-offset-primary/10  /* 环偏移色 10% 透明度 */
ring-border/10          /* 环色 10% 透明度 */
```

### 📝 字体排版类

#### 标题系统
```css
/* 主标题 */
font-serif              /* 自定义衬线字体 var(--font-instrument-serif) */
text-5xl                /* 48px 基础尺寸 */
italic                  /* 斜体 */
text-foreground         /* 前景色变量 */

/* 响应式字号 */
short:lg:text-8xl       /* 矮屏幕大尺寸：96px */
sm:text-8xl             /* 小屏幕：96px */
lg:text-9xl             /* 大屏幕：128px */
```

#### 正文排版
```css
/* 描述文字 */
text-base               /* 16px 基础字号 */
short:lg:text-lg        /* 矮屏幕大尺寸：18px */
sm:text-lg              /* 小屏幕：18px */
lg:text-xl              /* 大屏幕：20px */

font-medium             /* 中等字重 */
text-center             /* 居中对齐 */
text-pretty             /* 美化文本显示 */
leading-[1.1]!          /* 强制行高 1.1 */
text-balance            /* 平衡文本换行 */
```

### 📱 响应式设计类

#### 自定义断点
```css
/* 矮屏幕适配（高度 < 748px）*/
short:lg:pt-10          /* 矮屏幕大尺寸时 40px 顶部间距 */
short:lg:gap-4          /* 矮屏幕大尺寸时 16px 间距 */
short:lg:text-8xl       /* 矮屏幕大尺寸时 96px 字号 */
```

#### 标准响应式
```css
/* 间距响应式 */
md:gap-6                /* 中等屏幕 24px 间距 */
lg:gap-8                /* 大屏幕 32px 间距 */

/* 尺寸响应式 */
max-w-xl                /* 最大宽度 576px */
max-w-3xl               /* 最大宽度 768px */
```

### 🎭 特殊功能类

#### 定位系统
```css
/* 底部定位 */
absolute                /* 绝对定位 */
bottom-[calc(var(--inset)+0.8rem)]     /* 动态计算底部距离 */
md:bottom-[calc(var(--inset)+1.5rem)] /* 响应式动态底部距离 */
left-1/2                /* 左边距 50% */
-translate-x-1/2        /* X轴负向移动 50%（水平居中） */
```

#### 尺寸控制
```css
/* 图标尺寸 */
size-5                  /* 20px × 20px */
size-6                  /* 24px × 24px */
w-4 h-4                /* 16px × 16px */

/* 容器尺寸 */
min-h-0                 /* 最小高度 0 */
shrink             /* 允许缩小 */
max-h-[calc(70dvh-var(--footer-safe-area))]  /* 动态最大高度 */
```

#### 特殊选择器
```css
/* CSS选择器语法 */
[&_p]:my-4             /* 所有 p 标签的垂直外边距 16px */
text-current           /* 继承当前文字颜色 */
```

## 🤖 AI 样式修改指南

### 风格保持提示词模板

当需要 AI 修改样式时，请使用以下提示词：

````markdown
请按照以下设计系统规范修改样式，确保与现有风格一致：

## 设计风格要求
- **玻璃态美学**: 使用 `backdrop-blur-xl`、`bg-primary/20`、`border-border/50` 创建毛玻璃效果
- **圆角系统**: 按钮输入框用 `rounded-full`，卡片用 `rounded-3xl`，背景用 `rounded-[42px] md:rounded-[72px]`
- **阴影系统**: 使用自定义 `shadow-button` 和多层 `ring-1 ring-offset-2` 效果
- **间距系统**: 页面边距用 `p-inset px-sides pb-footer-safe-area`，组件间距用 `gap-4 gap-6 gap-8`

## 字体排版规范
- **主标题**: `font-serif text-5xl italic short:lg:text-8xl sm:text-8xl lg:text-9xl text-foreground`
- **正文**: `text-base short:lg:text-lg sm:text-lg lg:text-xl font-medium text-center text-pretty`
- **行高**: 使用 `leading-[1.1]!` 紧凑行高

## 响应式规范
- **矮屏幕适配**: 使用 `short:lg:` 前缀处理高度 < 748px 的设备
- **标准响应式**: 使用 `sm:` `md:` `lg:` 前缀
- **动态尺寸**: 用 `calc()` 表达式，如 `bottom-[calc(var(--inset)+0.8rem)]`

## 色彩变量使用
- 文字: `text-foreground`
- 背景: `bg-primary/20`
- 边框: `border-border/50`
- 图标: `text-current`

## 布局模式
```tsx
// 页面容器模式
<main className="p-inset h-dvh w-full">
  <div className="relative h-full w-full">
    // 内容
  </div>
</main>

// 居中内容模式
<div className="flex flex-col justify-center items-center pt-10 px-sides pb-footer-safe-area">
  // 内容
</div>

// 玻璃态卡片模式
<div className="backdrop-blur-xl bg-primary/20 border-2 border-border/50 rounded-3xl ring-1 ring-offset-2 ring-border/10 shadow-button">
  // 内容
</div>
```

请严格按照以上规范修改 [具体需求描述]，确保新样式与现有设计保持一致。
````

### 具体使用场景示例

#### 1. 创建新按钮组件
```
请创建一个与现有风格一致的次要按钮组件，使用以上设计系统规范。
要求：玻璃态背景、圆角边框、自定义阴影、hover 效果。
```

#### 2. 修改现有卡片样式
```
请修改以下卡片组件的样式，保持现有的玻璃态美学风格：
[粘贴现有代码]

要求：使用设计系统中的圆角、背景、边框、阴影规范。
```

#### 3. 添加响应式支持
```
请为以下组件添加响应式支持，遵循设计系统的响应式规范：
[粘贴现有代码]

要求：支持 short:lg（矮屏幕）、sm、md、lg 断点。
```

## 💡 组件示例

### 标准按钮组件
```tsx
const Button = ({ children, variant = 'default', ...props }) => {
  const variants = {
    default: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors-and-shadows duration-300 ease-out border border-border/50 hover:border-border/15 bg-primary/20 hover:bg-primary/30 backdrop-blur-xs text-primary ring-1 ring-offset-primary/10 ring-border/10 ring-offset-2 shadow-button hover:shadow-button-hover px-8 h-11",

    iconButton: "inline-flex items-center justify-center border border-border/50 hover:border-border/15 bg-primary hover:bg-primary backdrop-blur-xs text-primary-foreground ring-1 ring-offset-2 shadow-button hover:shadow-button-hover rounded-full size-11"
  };

  return (
    <button className={variants[variant]} {...props}>
      {children}
    </button>
  );
};
```

### 玻璃态卡片组件
```tsx
const GlassCard = ({ children, className, ...props }) => {
  return (
    <div
      className={`
        backdrop-blur-xl
        bg-primary/20
        border-2 border-border/50
        rounded-3xl
        ring-1 ring-offset-primary/10 ring-border/10 ring-offset-2
        shadow-button
        p-6
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
```

### 页面布局组件
```tsx
const PageLayout = ({ children, background }) => {
  return (
    <main className="p-inset h-dvh w-full">
      <div className="relative h-full w-full">
        {background && (
          <div className="absolute bg-background left-0 top-0 w-full h-full object-cover rounded-[42px] md:rounded-[72px]">
            {background}
          </div>
        )}
        <div className="flex overflow-hidden relative flex-col gap-4 justify-center items-center pt-10 w-full h-full short:lg:pt-10 pb-footer-safe-area px-sides short:lg:gap-4 lg:gap-8">
          {children}
        </div>
      </div>
    </main>
  );
};
```

## 📚 最佳实践

### ✅ 推荐做法
- 始终使用设计系统中定义的间距变量（`p-inset`、`px-sides`、`pb-footer-safe-area`）
- 玻璃态效果必须包含：`backdrop-blur-xl` + `bg-primary/20` + `border-border/50`
- 圆角使用层级：`rounded-full` > `rounded-3xl` > `rounded-[42px]`
- 阴影使用自定义的 `shadow-button` 系统
- 响应式优先考虑 `short:lg:` 断点适配

### ❌ 避免做法
- 不要使用标准的 Tailwind 阴影类（如 `shadow-lg`）
- 不要忽略 `short:lg:` 断点适配
- 不要直接使用颜色值，应使用语义化变量
- 不要破坏现有的玻璃态视觉层次
- 不要随意修改自定义变量值

## 🔄 版本更新

当设计系统需要更新时，请：
1. 更新此文档
2. 同步更新 `tailwind.config.js` 和 `globals.css`
3. 验证所有现有组件的兼容性
4. 更新 AI 提示词模板

---

*本文档最后更新：2025-01-15*