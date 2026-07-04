# 部署

## 前置条件

- Cloudflare 账号
- 同账号下已部署 [cf-kv-filesystem](https://github.com/joyanhui/cf-kv-filesystem)

## 部署方式

**仅支持通过 Cloudflare Workers Builds（GitHub 集成）自动部署，禁止命令行部署。**

### 1. 在 Cloudflare Dashboard 设置环境变量（Secret）

| 变量 | 说明 |
|------|------|
| `KV_FS_API_KEY` | cf-kv-filesystem 的 API Key |
| `JWT_ADMIN_SECRET` | 管理员 JWT 签名密钥 |

### 2. 配置 Workers Builds

| 配置项 | 值 |
|--------|-----|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Framework preset | None |

### 3. 推送至 GitHub

推送到 `main` 分支后自动构建并部署。

### 首次部署后

访问部署 URL（如 `https://cf-shorturl.xxxxx.workers.dev`），进入登录页面。

**默认密码:** `admin` / `admin888`（登录后请立即修改密码）
