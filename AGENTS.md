# AGENTS.md — AI 助手指南

## 项目概述

CF ShortURL 是一个基于 Cloudflare Workers + KV 的单用户短链接管理系统。

**技术栈:** Bun · TypeScript · Astro · Cloudflare KV

## 关键文件

| 文件 | 作用 |
|------|------|
| `src/lib/kv.ts` | KV 存储操作（CRUD + 搜索） |
| `src/lib/types.ts` | ShortLink 类型定义 |
| `src/pages/[slug].ts` | 短链接访问处理（重定向/iframe/内容返回） |
| `src/pages/api/links.ts` | RESTful API（GET/POST/PUT/DELETE） |
| `src/pages/index.astro` | 管理后台页面 |

## 数据模型

```typescript
interface ShortLink {
  slug: string;
  url: string;
  mode: 'redirect_302' | 'redirect_301' | 'iframe' | 'text' | 'html';
  title?: string;        // iframe 页面标题
  inject_js?: string;    // iframe 注入 JS
  content?: string;      // text/html 返回内容
  content_type?: string; // 自定义 Content-Type
  created_at: string;
  updated_at: string;
  visit_count: number;
}
```

KV 键: `link:{slug}` → JSON.stringify(ShortLink)

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
- API 路由由 Astro 文件系统路由处理
- 管理后台为单页面应用，使用原生 JS 实现交互

## 常用操作

- **新增模式**: 在 `src/lib/types.ts` 的 `LinkMode` 类型中添加，在 `[slug].ts` 的 `switch` 中添加处理逻辑
- **新增 API**: 在 `src/pages/api/links.ts` 中添加对应方法
- **修改 KV 键结构**: 修改 `src/lib/kv.ts` 中的 `LINK_PREFIX`

## vscode 工作流建议

```json
{
  "typescript.tsdk": "node_modules/typescript/lib"
}
```
