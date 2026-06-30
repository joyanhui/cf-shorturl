# 🔗 CF ShortURL

基于 Cloudflare Workers + KV 的短链接管理系统。

**技术栈:** Bun · TypeScript · Astro · Cloudflare KV

---

## 功能

- 自动/手动生成短链接（slug）
- 302/301 跳转、Iframe 隐藏转发、HTML/JS/JSON/CSS 返回、纯文本返回
- BasicAuth 访问保护（支持 `http://user:pass@domain/slug` 直连）
- 管理员登录 + 会话管理（默认 `admin` / `admin888`）
- 搜索、编辑、删除、访问统计
- 管理后台

## 快速开始

```bash
chmod +x dev.sh && ./dev.sh     # 本地开发
# 或手动: bun install && bun run dev
```

访问 `http://localhost:4321` → 登录页，默认密码 `admin888`。

## 部署

```bash
bunx wrangler login                               # 登录 Cloudflare
bunx wrangler kv namespace create KV               # 创建 KV 命名空间
# 将输出的 id 写入 wrangler.jsonc 的 KV 绑定中
bun run deploy                                     # 构建 + 部署
```

详细部署说明见 [docs/deploy.md](docs/deploy.md)。

## 目录

```
src/
├── lib/types.ts        # 数据模型（以此为准）
├── lib/kv.ts           # KV 操作
├── lib/auth.ts         # 认证 & 会话
├── pages/index.astro   # 管理后台
├── pages/login.astro   # 登录页
├── pages/[slug].ts     # 短链接入口
└── pages/api/          # API 路由
```

## 文档

| 文档 | 内容 |
|------|------|
| [docs/api.md](docs/api.md) | API 接口说明 |
| [docs/deploy.md](docs/deploy.md) | 部署步骤 |
| [docs/development.md](docs/development.md) | 开发指南 & 数据模型 |
| [AGENTS.md](AGENTS.md) | AI 助手指南 |

## 命令

| 命令 | 说明 |
|------|------|
| `bun run dev` | 开发服务器 |
| `bun run build` | 构建 |
| `bun run preview` | 本地预览 |
| `bun run deploy` | 部署 |
| `bun run cf-typegen` | 生成 CF 类型声明 |

## License

MIT
