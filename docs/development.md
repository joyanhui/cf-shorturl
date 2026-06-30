# 开发指南

## 数据模型

数据模型定义在 `src/lib/types.ts`，所有修改以此文件为准。

```typescript
// 核心类型
interface ShortLink {
  slug: string;                // 短链标识
  url: string;                 // 目标 URL
  mode: LinkMode;              // 响应模式
  title?: string;              // iframe 标题
  inject_js?: string;          // iframe 注入 JS
  content?: string;            // text/html 内容
  content_type?: string;       // 自定义 Content-Type
  basic_auth_username?: string;
  basic_auth_password?: string;
  created_at: string;
  updated_at: string;
  visit_count: number;
}
```

KV 键格式: `link:{slug}` → `JSON.stringify(ShortLink)`

## 本地开发

```bash
./dev.sh           # 一键启动
bun run dev        # 开发服务器 (localhost:4321)
bun run build      # 构建
bun run preview    # 本地预览 (需要先 build)
```

## 新增功能流程

### 新增字段（以 BasicAuth 为例）

1. `src/lib/types.ts` — 在三个接口中添加字段
2. `src/lib/kv.ts` — 在 createLink / updateLink 中读写
3. `src/pages/[slug].ts` — 在 handler 中使用字段
4. `src/pages/index.astro` — 表单 + 表格 + JS 提交

### 新增响应模式

1. `src/lib/types.ts` — 将新模式加入 `LinkMode` 联合类型
2. `src/pages/[slug].ts` — 在 switch 中添加 case

## 项目结构

```
src/
├── lib/
│   ├── types.ts       # 类型定义
│   ├── kv.ts          # KV CRUD
│   └── auth.ts        # 认证 & 会话
├── pages/
│   ├── index.astro    # 管理后台
│   ├── login.astro    # 登录页
│   ├── [slug].ts      # 短链接入口
│   └── api/
│       ├── links.ts           # 短链接 CRUD API
│       ├── login.ts           # 登录/登出 API
│       └── change-password.ts # 修改密码 API
└── layouts/
    └── BaseLayout.astro
```
