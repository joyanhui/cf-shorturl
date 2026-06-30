# AGENTS.md — AI 助手指南

> 供 AI 编码助手（Cursor / Copilot / OpenCode 等）使用。

## 项目概述

基于 Cloudflare Workers + KV 的单用户短链接管理系统。

**技术栈:** Bun · TypeScript · Astro · Cloudflare KV

## 关键文件

| 文件 | 作用 |
|------|------|
| `src/lib/types.ts` | ShortLink 类型定义（**数据模型以此为准**） |
| `src/lib/kv.ts` | KV 存储操作（CRUD + 搜索） |
| `src/lib/auth.ts` | 管理员认证、会话管理 |
| `src/pages/[slug].ts` | 短链接访问处理（重定向/iframe/内容返回/BasicAuth） |
| `src/pages/api/links.ts` | RESTful API（GET/POST/PUT/DELETE） |
| `src/pages/api/login.ts` | 登录/登出 API |
| `src/pages/api/change-password.ts` | 修改密码 API |
| `src/pages/index.astro` | 管理后台页面 |
| `src/pages/login.astro` | 登录页面 |

## 数据模型

数据结构定义见 `src/lib/types.ts`。简要说明：

- KV 键: `link:{slug}` → `JSON.stringify(ShortLink)`
- 管理员配置: `config:admin` → `{ username, passwordHash }`（SHA-256）
- 会话: `session:{token}` → `"1"`（TTL 24h）

## 运行命令

```bash
bun run dev       # 开发服务器
bun run build     # 构建
bun run preview   # Wrangler 本地预览
bun run deploy    # 部署到 Cloudflare
```

## 架构说明

- Astro SSR 模式，部署为 Cloudflare Worker
- KV 通过 `context.locals.runtime.env.KV` 访问
- 管理后台需要登录，通过 Cookie 中的 `session` token 校验
- 短链接访问无认证，除非设置了 BasicAuth

## 新增字段步骤（以 BasicAuth 为例）

1. `src/lib/types.ts` — 在 `ShortLink` / `CreateLinkInput` / `UpdateLinkInput` 中添加字段
2. `src/lib/kv.ts` — 在 `createLink()` 和 `updateLink()` 中读写新字段
3. `src/pages/[slug].ts` — 在 `GET` 处理函数中使用新字段（如 BasicAuth 校验）
4. `src/pages/index.astro` — 在表单中添加 UI 字段，在 `renderLinks()` 表格中展示，在 `submit` 事件中收集数据

## 常用操作

- **新增模式**: 在 `src/lib/types.ts` 的 `LinkMode` 类型中添加，在 `[slug].ts` 的 `switch` 中添加处理逻辑
- **新增 API**: 在 `src/pages/api/links.ts` 中添加对应方法
- **修改 KV 键结构**: 修改 `src/lib/kv.ts` 中的 `LINK_PREFIX`
