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

## 方法二：kv-filesystem 管理面板

1. 登录 kv-filesystem 管理后台
2. 在文件列表中找到 `shorturl_config:admin_password` 条目
3. **修改：** 编辑该条目，将内容替换为新的 SHA-256 哈希值（本地计算：`echo -n "NEW_PASSWORD" | sha256sum`）
4. **或删除：** 删除该条目后，cf-shorturl 下次登录时会自动回退到默认密码 `admin`

## 方法三：wrangler CLI

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
