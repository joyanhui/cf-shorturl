# 部署

## 前置条件

- [Bun](https://bun.sh) >= 1.0
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)（随项目自动安装）
- Cloudflare 账号

## 部署步骤

```bash
# 1. 登录 Cloudflare
bunx wrangler login

# 2. 创建 KV 命名空间
bunx wrangler kv namespace create KV

# 3. 将输出的 id 写入 wrangler.jsonc
#    { "binding": "KV", "id": "your-namespace-id" }

# 4. 构建并部署
bun run deploy
```

## 首次部署后

访问部署 URL（如 `https://cf-shorturl.xxxxx.pages.dev`），进入登录页面。

**默认密码:** `admin` / `admin888`

登录后可在后台修改密码。

## 后续更新

```bash
bun run deploy
```
