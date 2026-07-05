# 找回管理员密码

管理员密码以 SHA-256 哈希存储在 kv-filesystem 的 D1 数据库中，key 为 `shorturl_config:admin_password`。

## 方法一：Cloudflare Dashboard

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → `kv-filesystem`
2. 进入 **D1** 标签页 → 点 `kv-filesystem` 数据库
3. 点 **Console** 按钮打开 SQL 控制台
4. 查询当前密码哈希：
   ```sql
   SELECT value FROM config WHERE name = 'shorturl_config:admin_password';
   ```
5. 重置新密码（将 `admin` 替换为实际密码，在本地计算 SHA-256 后填入）：
   ```sql
   INSERT OR REPLACE INTO config VALUES('shorturl_config:admin_password','"<SHA256_HASH>"');
   ```

## 方法二：wrangler CLI

确保本地已登录 Cloudflare 账号：

```sh
npx wrangler d1 execute kv-filesystem --remote --command "SELECT value FROM config WHERE name = 'shorturl_config:admin_password';"
```

重置密码（将 `NEW_PASSWORD` 替换为实际密码）：

```sh
HASH=$(echo -n "NEW_PASSWORD" | sha256sum | cut -d' ' -f1)
npx wrangler d1 execute kv-filesystem --remote --command "INSERT OR REPLACE INTO config VALUES('shorturl_config:admin_password','\"$HASH\"');"
```

## 默认密码

首次部署后未手动设置过密码时，默认密码为 `admin`。
