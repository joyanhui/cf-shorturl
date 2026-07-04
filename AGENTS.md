# AGENTS.md

## 技术栈

Bun + React + React Router + Hono + OpenAPI + Tailwind CSS + shadcn/ui + Zod，D1 数据库用 Drizzle ORM。

## 通用规范

- **禁止使用 `any`** — 所有类型必须显式声明。API handler 用 Zod schema 校验请求，`parse()` 或 `safeParse()` 替代 `as any`。
- **禁止手写 OpenAPI JSON** — 公开 API 用 `@hono/zod-openapi` 的 `OpenAPIHono` + `createRoute` 自动生成。
- **禁止手写 CSS** — 使用 Tailwind CSS v4 utility classes + shadcn/ui 组件。
- **文件行数不超过 800 行** — 大型模块拆分为 `pages/` 和 `components/`。
- **ESM** — 所有文件使用 ESM 模块 (`import`/`export`)。
- **API Handler 签名:** `handleXxx(request: Request, env: Env, ...) → Promise<Response>`。
- **错误响应:** 统一 `Response.json({ error: string }, { status })`。
- **Zod schema 集中定义**在 `src/schemas/index.ts`，API handler 和 OpenAPI 共用。
- **前端代码集中在 `src/frontend/`**，SSR 组件（Homepage, ErrorPage, Layout）和 SPA（Dashboard 等）均在此目录。
- **构建:** `bun scripts/build.ts` 编译 Tailwind + esbuild 打包 SPA，产物内联到 `admin.gen.ts`。
- **esbuild alias `@` → `src`**，shadcn 组件用 `npx shadcn@latest add` 添加到 `src/frontend/components/ui/`。

## 部署（重要）

**仅使用 Cloudflare 网页端 GitHub 集成部署**。禁止本地 `bun run deploy` / `wrangler deploy`。

| | cf-shorturl |
|---|---|
| Deploy command | 留空 |
| Build command | 留空 |
| 构建触发 | GitHub Auto Build |

## 环境变量（全部设为 Secret 类型）

- `JWT_ADMIN_SECRET` — 管理员 JWT 签名密钥
- `KV_FS_API_KEY` — kv-filesystem 的 API Key

## 项目描述

基于 Cloudflare Workers 的单用户短链接管理系统，通过 Service Binding 调用 cf-kv-filesystem Worker 存取数据。

- 无 KV/D1/R2 绑定，存储通过 `env.KV_FILESYSTEM.fetch()` 操作 kv-filesystem Worker
- 数据前缀: `shorturl_link:{slug}`、`shorturl_links:index`、`shorturl_config:*`
- 认证: 无状态 JWT（HMAC-SHA256），登录验证 SHA-256 密码后签发 JWT cookie
- 短链接边缘缓存: `caches.default`（301 一年 / 302/iframe/text/html 5 分钟），CRUD 时清除
- 模块级内存缓存: 索引 60s TTL，配置 5 分钟 TTL
- 额外功能: Turnstile 验证码、Basic Auth、iframe 嵌入

## 关键文件

| 文件 | 作用 |
|---|---|
| `src/index.ts` | Worker 入口 + 路由分发（Hono app + admin 子路由） |
| `src/schemas/index.ts` | Zod 请求/响应 schema 定义 |
| `src/jwt.ts` | HMAC-SHA256 JWT 原语 |
| `src/render.tsx` | React SSR 渲染辅助 |
| `src/types.ts` | Env 接口 |
| `src/lib/types.ts` | 数据模型（ShortLink, SiteSettings） |
| `src/lib/kv-fs.ts` | kv-filesystem HTTP 客户端（含内存缓存）+ 链接索引管理 |
| `src/lib/auth.ts` | 管理员认证（SHA-256 密码 + JWT 签发/验证） |
| `src/admin/index.ts` | 管理 API 路由注册（Hono 子应用） |
| `src/admin/auth.ts` | JWT cookie 校验 |
| `src/admin/api_*.ts` | 各功能模块 API（Zod 校验） |
| `src/frontend/App.tsx` | SPA 根组件（BrowserRouter） |
| `src/frontend/Dashboard.tsx` | 管理面板（表格/Modal/搜索/分页） |
| `src/frontend/LoginPage.tsx` | 登录表单（支持 Turnstile） |
| `src/frontend/Layout.tsx` | SSR Layout |
| `src/frontend/Homepage.tsx` | 公开首页（SSR） |
| `src/frontend/ErrorPage.tsx` | 错误页（SSR） |
| `src/frontend/index.tsx` | SPA 客户端 hydrate 入口 |
| `src/frontend/admin.gen.ts` | **自动生成** — 内嵌 SPA HTML + CSS + JS |
| `scripts/build.ts` | 构建脚本 |
