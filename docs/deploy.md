# 部署

## 部署顺序

**必须先部署 kv-filesystem，再部署 cf-shorturl。** 因为 cf-shorturl 通过 Service Binding 调用 kv-filesystem，如果后者不存在，部署会失败（错误码 10143）。

## 部署方式

**仅支持通过 Cloudflare Workers Builds 自动部署，禁止命令行部署。**

### Cloudflare Workers Builds 是什么？

Workers Builds 是 Cloudflare 提供的 CI/CD 服务，不是 GitHub Actions。

当您推送代码到 GitHub 仓库时：
1. GitHub 通知 Cloudflare 有新的提交
2. Cloudflare 根据您配置的 **Build command** 构建项目
3. Cloudflare 根据您配置的 **Deploy command** 部署 Worker
4. 整个过程在 Cloudflare 平台完成，不需要 `.github/workflows/*.yml` 文件

您看到的构建记录来自 **Cloudflare Dashboard → Workers & Pages → cf-shorturl → Builds**，不是 GitHub 的 Actions 页面。

### 0. 部署 kv-filesystem

先在同账号下部署 [cf-kv-filesystem](https://github.com/joyanhui/cf-kv-filesystem) Worker（部署后的 Worker 名称为 kv-filesystem）。

部署完成后，在 kv-filesystem 的管理面板中创建一个 **API Key**，保留下一步使用。

### 1. 在 Cloudflare Dashboard 设置环境变量

路径：**Cloudflare Dashboard → Workers & Pages → cf-shorturl → Settings → Variables**

添加以下两个 Secret 变量：

| 变量 | 类型 | 说明 |
|------|------|------|
| `KV_FS_API_KEY` | Secret | cf-kv-filesystem 的 API Key |
| `JWT_ADMIN_SECRET` | Secret | 管理员 JWT 签名密钥 |

> `KV_FILESYSTEM` Service Binding 在 `wrangler.jsonc` 中声明，**不需要**手动添加为环境变量。部署时 wrangler 会自动绑定同账号下的 `kv-filesystem` Worker。

### 2. 配置 Workers Builds

路径：**Cloudflare Dashboard → Workers & Pages → cf-shorturl → Builds**

| 配置项 | 填写值 | 说明 |
|--------|--------|------|
| **Build command** | `npm run build` | 运行 `scripts/build.ts`，编译 Tailwind CSS + 打包 SPA |
| **Deploy command** | `npx wrangler deploy` | 部署 Worker（基于 `wrangler.jsonc`） |
| **Framework preset** | **None** | 不使用预设，使用自定义命令 |

构建失败排查：在 Cloudflare Dashboard 的 Builds 标签页查看构建日志。

### 3. 推送至 GitHub

推送到 `main` 分支后自动构建并部署。

### 首次部署后

访问部署 URL（如 `https://cf-shorturl.xxxxx.workers.dev`），进入登录页面。

**默认密码:** `admin` / `admin888`（登录后请立即修改密码）
