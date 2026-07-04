# AGENTS.md — AI 助手指南

> 供 AI 编码助手（Cursor / Copilot / OpenCode 等）使用。

## 项目概述

基于 Cloudflare Workers + React SSR/SPA 的单用户短链接管理系统。

**技术栈:** Bun · TypeScript · React 19 · Tailwind CSS · esbuild · Cloudflare Workers

**存储依赖:** 通过 Service Binding 调用同账号下的 [cf-kv-filesystem](https://github.com/joyanhui/cf-kv-filesystem) Worker，自身不依赖任何 KV / D1 / R2。

## 关键文件

| 文件 | 作用 |
|------|------|
| `src/index.ts` | Worker 入口 + 路由分发（API / 页面 / 短链接） |
| `src/jwt.ts` | HMAC-SHA256 JWT 原语 |
| `src/render.tsx` | React SSR 渲染辅助 |
| `src/types.ts` | Env 接口（KV_FILESYSTEM, KV_FS_API_KEY, JWT_ADMIN_SECRET） |
| `src/lib/types.ts` | ShortLink 类型定义（**数据模型以此为准**） |
| `src/lib/kv-fs.ts` | kv-filesystem HTTP 客户端（含内存缓存）+ 链接索引管理 |
| `src/lib/auth.ts` | 管理员认证（SHA-256 密码 + JWT 签发/验证） |
| `src/admin/index.ts` | 管理 API 路由分发 |
| `src/admin/auth.ts` | JWT cookie 校验 |
| `src/admin/api_links.ts` | 短链接 CRUD API（含边缘缓存清除） |
| `src/admin/api_login.ts` | 登录/登出 API |
| `src/admin/api_change_password.ts` | 修改密码 API |
| `src/admin/api_settings.ts` | 系统设置 API（Turnstile 验证码配置）|
| `src/frontend/App.tsx` | SPA 根组件（登录/仪表盘切换） |
| `src/frontend/Dashboard.tsx` | 管理面板（表格/Modal/搜索/分页） |
| `src/frontend/LoginPage.tsx` | 登录表单（支持 Turnstile） |
| `src/frontend/Layout.tsx` | SSR Layout |
| `src/frontend/ErrorPage.tsx` | 404 错误页（SSR） |
| `src/frontend/index.tsx` | SPA 客户端 hydrate 入口 |
| `src/frontend/admin.gen.ts` | **自动生成** — 内嵌 SPA HTML + Tailwind CSS + JS |
| `scripts/build.ts` | 构建脚本（Tailwind 编译 + esbuild SPA 打包） |

## 数据模型

数据结构定义见 `src/lib/types.ts`。存储于 cf-kv-filesystem，所有 pkey 以 `shorturl_` 为前缀：

| pkey | 值 |
|------|-----|
| `shorturl_link:{slug}` | `JSON.stringify(ShortLink)` |
| `shorturl_links:index` | `string[]`（slugs 数组，按创建时间降序） |
| `shorturl_config:admin` | `{ username, passwordHash }`（SHA-256） |
| `shorturl_config:settings` | `{ turnstile_site_key?, turnstile_secret_key? }` |

## 运行命令

```bash
bun run build     # 构建 Tailwind CSS + SPA
bun run dev       # 构建并启动 wrangler 开发服务器
bun run preview   # 构建并启动 wrangler 开发服务器（局域网访问）
```

禁止使用 `bun run deploy` 或 `npx wrangler deploy` 部署，必须通过 Cloudflare Workers Builds（GitHub 集成）自动部署。

## 架构说明

- Plain Cloudflare Worker，手动路由分发（无 Astro / Next.js 等框架）
- **认证**: 无状态 JWT（HMAC-SHA256），登录验证密码后签发 JWT cookie，无会话存储
- **存储**: 通过 Service Binding 调用 cf-kv-filesystem，自身无 KV/D1/R2 绑定
- **缓存策略**:
  - 短链接访问: `caches.default` 边缘缓存（301 一年 TTL，302/iframe/text/html 5 分钟 TTL），CRUD 时主动清除
  - 配置/索引: 模块级内存缓存（索引 60s TTL，配置 5 分钟 TTL），写入时清除
- 管理后台: React SPA，通过 `/api/*` 接口与 Worker 交互
- 登录页: 同上 SPA（未认证时显示登录表单）

## 缓存管理

短链接访问走 `caches.default`，CRUD 操作时通过 `ctx.waitUntil()` 异步清除缓存：

```typescript
// 更新/删除时清除边缘缓存
ctx.waitUntil(caches.default.delete(cacheKey));
```

## 环境变量（Cloudflare Dashboard 设置）

| 变量 | 类型 | 说明 |
|------|------|------|
| `KV_FS_API_KEY` | Secret | kv-filesystem 的 API Key |
| `JWT_ADMIN_SECRET` | Secret | 管理员 JWT 签名密钥 |

## 新增字段步骤（以 BasicAuth 为例）

1. `src/lib/types.ts` — 在 `ShortLink` / `CreateLinkInput` / `UpdateLinkInput` 中添加字段
2. `src/lib/kv-fs.ts` — 在 `createLink()` 和 `updateLink()` 中读写新字段
3. `src/index.ts` — 在 `handleSlug()` 中使用新字段
4. `src/frontend/Dashboard.tsx` — 在表单中添加 UI 字段

## 常用操作

- **新增模式**: 在 `src/lib/types.ts` 的 `LinkMode` 类型中添加，在 `src/index.ts` 的 `switch` 中添加处理逻辑
- **新增 API**: 在 `src/admin/` 下添加对应模块，在 `src/admin/index.ts` 注册路由
- **修改存储键结构**: 修改 `src/lib/kv-fs.ts` 中的 `PREFIX`
