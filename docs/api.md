# API 文档

所有管理 API 需要通过管理员会话认证（通过 Cookie 传递 `session` token）。

## 认证

### 登录

```
POST /api/login
Content-Type: application/json

{ "password": "admin888" }
```

成功返回 `200` + `Set-Cookie` 头。后续请求自动携带。

### 退出登录

```
DELETE /api/login
```

### 修改密码

```
POST /api/change-password
Content-Type: application/json

{ "oldPassword": "admin888", "newPassword": "xxx123" }
```

## 短链接管理

### 获取列表

```
GET /api/links
GET /api/links?search=关键字
```

### 获取单个

```
GET /api/links?slug=abc123
```

### 创建

```
POST /api/links
Content-Type: application/json

{
  "slug": "abc123",
  "url": "https://example.com",
  "mode": "redirect_302",
  "title": "页面标题",
  "inject_js": "console.log('hi')",
  "content": "<h1>Hello</h1>",
  "content_type": "text/html",
  "basic_auth_username": "admin",
  "basic_auth_password": "secret"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `slug` | 否 | 留空自动生成 6 位随机 |
| `url` | 是 | 目标 URL |
| `mode` | 是 | `redirect_302` / `redirect_301` / `iframe` / `html` / `text` |
| `title` | 否 | iframe 页面标题 |
| `inject_js` | 否 | iframe 注入的 JS |
| `content` | 否 | text/html 模式返回内容 |
| `content_type` | 否 | 自定义 Content-Type |
| `basic_auth_username` / `basic_auth_password` | 否 | BasicAuth 保护 |

### 更新

```
PUT /api/links
Content-Type: application/json

{ "slug": "abc123", "url": "https://new-url.com", "mode": "redirect_301" }
```

清空 auth：将 `basic_auth_username` 和 `basic_auth_password` 设为空字符串。

### 删除

```
DELETE /api/links?slug=abc123
```
