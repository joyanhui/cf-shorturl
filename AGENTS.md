# AGENTS.md

## 技术栈

Bun + React + React Router + Hono + OpenAPI + Tailwind CSS + shadcn/ui + Zod。

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
- **i18n 算法（SSR + SPA 共用）:** SSR 以 `Cookie → Accept-Language → 'en'` 顺序检测语言；SPA 以 `localStorage → navigator.language` 初始化，`useEffect` 同步到 `document.documentElement.lang` + localStorage + cookie，确保 SSR 页面刷新后 cookie 生效。
- **构建:** `bun scripts/build.ts` 编译 Tailwind + esbuild 打包 SPA，产物内联到 `admin.gen.ts`。
- **esbuild alias `@` → `src`**，shadcn 组件用 `npx shadcn@latest add` 添加到 `src/frontend/components/ui/`。

## 部署（重要）

部署通过 **Cloudflare Workers GitHub 集成**自动触发：推送代码到 GitHub → Cloudflare Dashboard 检测变更 → 自动拉取并执行 `wrangler deploy`。

**禁止本地 `bun run deploy` / `wrangler deploy`。**

Cloudflare Dashboard 配置：
- Workers & Pages → `cf-shorturl` → Settings → Git integration → 连接 GitHub 仓库
- Build command: 留空（wrangler 自动处理 TypeScript 打包）
- 实际构建流程：`wrangler deploy` → 自动 esbuild 打包 `src/index.ts` → 部署到 Cloudflare 边缘

**构建产物注意事项：** `src/frontend/admin.gen.ts`（SPA 前端产物）需在本地通过 `bun run build` 生成后提交到 Git。Cloudflare GitHub 集成仅运行 `wrangler deploy`，不会执行 `bun scripts/build.ts`。提交代码前请确保运行 `bun run build` 并提交生成的 `admin.gen.ts`。

### 查看线上状态

使用 `npx wrangler` 查看构建日志和线上状态：
- `npx wrangler deployments list` — 查看部署历史
- `npx wrangler tail cf-shorturl` — Worker 实时日志

根据线上日志修复代码后，推送即可触发重新部署。

## 环境变量（全部设为 Secret 类型）

- `JWT_ADMIN_SECRET` — 管理员 JWT 签名密钥
- `KV_FS_API_KEY` — kv-filesystem 的 API Key

## 设计目标

通过 Service Binding 调用 cf-kv-filesystem Worker 的单用户短链接管理系统，自身无 KV/D1/R2 依赖。

## 核心文件

| 文件 | 作用 |
|---|---|
| `src/index.ts` | Worker 入口 + Hono 路由分发（公开 app + admin 子路由） |
| `src/types.ts` | 环境变量类型（Env: KV_FILESYSTEM, KV_FS_API_KEY, JWT_ADMIN_SECRET） |
| `src/schemas/index.ts` | Zod schema（CreateLinkBody, UpdateLinkBody, LoginBody, SiteSettings 等） |
| `src/jwt.ts` | HMAC-SHA256 JWT 签发/验签原语 |
| `src/render.tsx` | React SSR 渲染辅助（renderHtml） |
| `src/lib/types.ts` | 数据模型（ShortLink, CreateLinkInput, UpdateLinkInput, SiteSettings） |
| `src/lib/kv-fs.ts` | kv-filesystem HTTP 客户端（内存缓存 + 链接索引管理） |
| `src/lib/auth.ts` | 管理员认证（SHA-256 密码管理 + JWT 签发/验证 + Cookie 工具） |
| `src/public.ts` | 公开 API — OpenAPIHono（首页 SSR, `/{slug}` 短链接访问, `/openapi.json`） |
| `src/admin/index.ts` | 管理 API 路由注册（Hono 子应用，requireAuth 中间件） |
| `src/admin/auth.ts` | JWT cookie 校验（checkAuth） |
| `src/admin/api_login.ts` | 登录/登出 |
| `src/admin/api_links.ts` | 短链接 CRUD + 边缘缓存清除 |
| `src/admin/api_change_password.ts` | 修改密码 |
| `src/admin/api_settings.ts` | 系统设置（Turnstile 验证码配置） |
| `src/frontend/App.tsx` | SPA 根组件（BrowserRouter + Routes） |
| `src/frontend/Dashboard.tsx` | 管理面板（表格/Modal/搜索/分页） |
| `src/frontend/LoginPage.tsx` | 登录表单（支持 Turnstile） |
| `src/frontend/Homepage.tsx` | 公开首页（SSR） |
| `src/frontend/ErrorPage.tsx` | 错误页（SSR） |
| `src/frontend/Layout.tsx` | SSR Layout |
| `src/frontend/i18n.ts` | 中英文翻译字典 |
| `src/frontend/index.tsx` | SPA 客户端 hydrate 入口 |
| `scripts/build.ts` | 构建脚本（Tailwind 编译 + esbuild SPA 打包） |

## 核心函数

| 函数 | 位置 | 说明 |
|---|---|---|
| `getLink(env, slug)` | lib/kv-fs | 读取短链接 |
| `createLink(env, input)` | lib/kv-fs | 创建短链接（自动生成 slug/去重） |
| `updateLink(env, input)` | lib/kv-fs | 更新短链接 |
| `deleteLink(env, slug)` | lib/kv-fs | 删除短链接 + 更新索引 |
| `listLinks(env, options?)` | lib/kv-fs | 列出短链接（搜索/筛选/分页） |
| `getLinksIndex(env)` | lib/kv-fs | 读取 slugs 索引（带 60s 内存缓存） |
| `getSettings(env)` / `updateSettings(env, input)` | lib/kv-fs | 系统设置读写（5 分钟内存缓存） |
| `getAdminConfig(env)` / `setAdminConfig(env)` | lib/kv-fs | 管理员密码配置读写 |
| `initAdmin(env)` | lib/auth | 首次初始化默认管理员 |
| `verifyAdmin(env, password)` | lib/auth | 验证管理员密码 |
| `signToken(env)` / `verifyToken(env, token)` | lib/auth | JWT 签发/验证 |
| `setTokenCookie(token, path)` / `clearTokenCookie(path)` | lib/auth | Cookie 工具 |
| `changePassword(env, oldPassword, newPassword)` | lib/auth | 修改密码 |
| `checkAuth(request, env)` | admin/auth | JWT cookie 校验中间件 |
| `generateSlug(length?)` | lib/kv-fs | 随机短链生成（base62） |

## 核心算法

**短链接访问:** URL `/{slug}` → 查 kv-filesystem（`getLink`）→ 按 `mode` 返回对应响应类型：
- `redirect_301` / `redirect_302` → HTTP 重定向
- `iframe` → HTML 页面内嵌 iframe（可选 inject_js）
- `text` → 纯文本内容
- `html` → HTML 内容
响应写入 `caches.default` 边缘缓存（301 一年 TTL / 其他 5 分钟 TTL），后续请求零回源。支持 Basic Auth 保护。

**管理后端:** SPA → 检查 `/api/check` → 未认证显示登录表单（Turnstile 支持） → 认证后 Dashboard 通过 `/api/*` 接口 CRUD。所有写操作（create/update/delete）通过 `ctx.waitUntil()` 异步清除对应边缘缓存条目。

**存储:** 所有数据通过 Service Binding HTTP 调用 kv-filesystem Worker 的 `GET/PUT/DELETE /api/v1/{pkey}` API（`X-API-Key` 认证），数据以 JSON 序列化存储。pkey 前缀 `shorturl_`：`shorturl_link:{slug}`（链接数据）、`shorturl_links:index`（slugs 数组）、`shorturl_config:admin`（密码配置）、`shorturl_config:settings`（系统设置）。模块级内存缓存减少重复请求（索引 60s TTL，配置 5 分钟 TTL）。

**密码:** SHA-256 哈希存储于 `shorturl_config:admin`，JWT（HMAC-SHA256）24h 过期，HttpOnly Cookie 传递。
