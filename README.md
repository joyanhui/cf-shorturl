# 🔗 CF ShortURL

基于 Cloudflare Workers + KV 的短链接管理系统。

**技术栈:** Bun · TypeScript · Astro · Cloudflare KV

---

## 功能特性

- **短链接生成** — 自动随机生成 slug，也可自定义
- **多种响应模式**:
  - `302` 临时跳转 / `301` 永久跳转
  - `Iframe` 隐藏转发（支持自定义标题、注入 JS）
  - `HTML` 返回任意内容（可设置 Content-Type，支持 HTML / JS / CSS / JSON 等）
  - `Text` 返回纯文本
- **完整 CRUD** — 创建、查询、搜索、编辑、删除
- **访问统计** — 每个短链接的点击次数自动记录
- **管理后台** — 浏览器端管理页面

## 项目结构

```
cf-shorturl/
├── src/
│   ├── lib/
│   │   ├── types.ts          # 类型定义
│   │   └── kv.ts             # KV 操作封装
│   ├── pages/
│   │   ├── index.astro       # 管理后台
│   │   ├── [slug].ts         # 短链接处理入口
│   │   └── api/
│   │       └── links.ts      # CRUD API
│   └── layouts/
│       └── BaseLayout.astro  # 基础布局
├── astro.config.mjs
├── wrangler.jsonc            # Cloudflare 配置
├── dev.sh                    # 本地开发启动脚本
└── package.json
```

## 快速开始

### 前置要求

- [Bun](https://bun.sh) >= 1.0
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) （通过 Bun 自动安装）
- Cloudflare 账号（用于部署）

### 本地开发

```bash
chmod +x dev.sh
./dev.sh
```

或者手动执行：

```bash
bun install
bun run dev
```

访问 `http://localhost:4321` 即可进入管理后台。

### 构建 & 预览

```bash
bun run build       # 构建生产版本
bun run preview     # 通过 wrangler 本地预览
```

### 部署到 Cloudflare

1. 创建 KV 命名空间：

```bash
bunx wrangler kv namespace create KV
```

2. 将输出的 `id` 写入 `wrangler.jsonc`：

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "你的命名空间ID"
    }
  ]
}
```

3. 部署：

```bash
bun run deploy
```

## API 文档

所有 API 通过 `/api/links` 访问。

### 获取链接列表

```
GET /api/links
GET /api/links?search=关键字
```

### 获取单个链接

```
GET /api/links?slug=abc123
```

### 创建链接

```
POST /api/links
Content-Type: application/json

{
  "slug": "abc123",          // 可选，留空自动生成
  "url": "https://example.com",
  "mode": "redirect_302",
  "title": "页面标题",        // iframe 模式
  "inject_js": "console.log('hi')", // iframe 模式
  "content": "<h1>Hello</h1>", // html/text 模式
  "content_type": "text/html" // html/text 模式，自定义 Content-Type
}
```

### 更新链接

```
PUT /api/links
Content-Type: application/json

{
  "slug": "abc123",
  "url": "https://new-url.com",
  "mode": "redirect_301"
}
```

### 删除链接

```
DELETE /api/links?slug=abc123
```

## 响应模式说明

| 模式 | 行为 | 可选参数 |
|------|------|----------|
| `redirect_302` | HTTP 302 临时跳转 | — |
| `redirect_301` | HTTP 301 永久跳转 | — |
| `iframe` | HTML 页面通过 iframe 嵌入目标 URL，地址栏不变 | `title`, `inject_js` |
| `html` | 返回自定义内容，可指定 Content-Type | `content`, `content_type` |
| `text` | 返回纯文本 | `content`, `content_type` |

## 开发命令

| 命令 | 说明 |
|------|------|
| `bun run dev` | 启动开发服务器 |
| `bun run build` | 构建生产版本 |
| `bun run preview` | Wrangler 本地预览 |
| `bun run deploy` | 部署到 Cloudflare |
| `bun run cf-typegen` | 生成 Cloudflare 类型声明 |

## License

MIT
