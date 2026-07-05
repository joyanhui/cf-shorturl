# 找回/重置管理员密码

管理员密码通过 `ADMIN_PASSWORD` 环境变量（Secret 类型）控制。

## 方法一：Cloudflare Dashboard（推荐）

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → `cf-shorturl`
2. 进入 **Settings → Variables**
3. 找到 `ADMIN_PASSWORD`，点击 **Edit** 修改值
4. 或删除该变量后重新添加（勾选 **Secret** 类型）
5. 修改后触发一次重新部署（推送任意 commit 或点 Save and Deploy）

## 方法二：wrangler CLI

```sh
echo "NEW_PASSWORD" | npx wrangler secret put ADMIN_PASSWORD --name cf-shorturl
```

然后推送代码触发重新部署：
```sh
git commit --allow-empty -m "redeploy to apply new ADMIN_PASSWORD" && git push
```

## 说明

- `ADMIN_PASSWORD` 为空时，登录 API 返回 503 错误，禁止登录
- 以前存储在 kv-filesystem D1 `shorturl_config:admin_password` 中的密码已不再使用

