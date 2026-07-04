# 开发指南

## 数据模型

数据模型定义在 `src/lib/types.ts`，所有修改以此文件为准。

KV 文件系统 pkey 格式: `shorturl_link:{slug}` → `JSON.stringify(ShortLink)`

## 本地开发

```bash
bun run dev        # 构建并启动 wrangler 开发服务器
bun run build      # 构建 Tailwind CSS + SPA
bun run preview    # 局域网访问模式
```

## 新增功能流程

### 新增字段（以 BasicAuth 为例）

1. `src/lib/types.ts` — 在三个接口中添加字段
2. `src/lib/kv-fs.ts` — 在 createLink / updateLink 中读写
3. `src/index.ts` — 在 handleSlug 中使用字段
4. `src/frontend/Dashboard.tsx` — 表单 + 表格

### 新增响应模式

1. `src/lib/types.ts` — 将新模式加入 `LinkMode` 联合类型
2. `src/index.ts` — 在 switch 中添加 case

## 项目结构

```
src/
├── index.ts          # Worker 入口 + 路由
├── types.ts          # Env 接口
├── jwt.ts            # JWT 原语
├── render.tsx        # React SSR
├── lib/
│   ├── types.ts      # ShortLink 类型
│   ├── kv-fs.ts      # kv-filesystem 客户端
│   └── auth.ts       # JWT 认证
├── admin/
│   ├── index.ts      # API 路由
│   ├── auth.ts       # Cookie JWT 校验
│   └── api_*.ts      # API handlers
└── frontend/
    ├── App.tsx        # SPA 根组件
    ├── Dashboard.tsx  # 管理面板
    ├── LoginPage.tsx  # 登录页
    ├── Layout.tsx     # SSR 布局
    ├── ErrorPage.tsx  # 404 页
    ├── i18n.ts        # 国际化
    └── index.tsx      # SPA 入口
```
