# Todo List API 测试用例文档

基础URL: `http://devbox.ns-mutrnoyx.svc.cluster.local:3000`

## 认证相关接口

### 1. 用户注册

**接口**: `POST /api/auth/register`

**测试用例**:

#### 成功案例
```bash
curl -X POST http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

**成功返回值** (201):
```json
{
  "id": 1,
  "username": "testuser123",
  "email": "test@example.com",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

#### 失败案例

**用户名已存在** (409):
```json
{
  "error": {
    "code": "DUPLICATE_ENTITY",
    "message": "用户名已存在"
  }
}
```

**邮箱已被注册** (409):
```json
{
  "error": {
    "code": "DUPLICATE_ENTITY",
    "message": "邮箱已被注册"
  }
}
```

**验证失败** (400):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "password",
        "message": "密码必须包含至少一个数字"
      }
    ]
  }
}
```

### 2. 用户登录

**接口**: `POST /api/auth/login`

**测试用例**:

#### 成功案例
```bash
curl -X POST http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "password": "Test123!"
  }'
```

**成功返回值** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### 失败案例

**用户名或密码错误** (401):
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "用户名或密码不正确"
  }
}
```

## 用户管理接口

### 3. 获取当前用户信息

**接口**: `GET /api/users/me`

**测试用例**:

#### 成功案例
```bash
curl -X GET http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**成功返回值** (200):
```json
{
  "id": 1,
  "username": "testuser123",
  "email": "test@example.com",
  "created_at": "2024-01-15T10:30:00.000Z",
  "last_login": "2024-01-15T11:00:00.000Z"
}
```

#### 失败案例

**未授权** (401):
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "访问令牌无效或已过期"
  }
}
```

### 4. 更新用户信息

**接口**: `PUT /api/users/me`

**测试用例**:

#### 成功案例
```bash
curl -X PUT http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'
```

**成功返回值** (200):
```json
{
  "id": 1,
  "username": "testuser123",
  "email": "newemail@example.com",
  "updated_at": "2024-01-15T12:00:00.000Z"
}
```

### 5. 更新密码

**接口**: `PUT /api/users/me/password`

**测试用例**:

#### 成功案例
```bash
curl -X PUT http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/users/me/password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "Test123!",
    "new_password": "NewTest456!"
  }'
```

**成功返回值** (200):
```json
{
  "message": "密码更新成功"
}
```

#### 失败案例

**当前密码错误** (400):
```json
{
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "当前密码不正确"
  }
}
```

## 分类管理接口

### 6. 创建分类

**接口**: `POST /api/categories`

**测试用例**:

#### 成功案例
```bash
curl -X POST http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "工作",
    "color": "#3498db"
  }'
```

**成功返回值** (201):
```json
{
  "id": 1,
  "name": "工作",
  "color": "#3498db",
  "user_id": 1,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### 7. 获取分类列表

**接口**: `GET /api/categories`

**测试用例**:

#### 成功案例
```bash
curl -X GET http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**成功返回值** (200):
```json
[
  {
    "id": 1,
    "name": "工作",
    "color": "#3498db",
    "task_count": 5
  },
  {
    "id": 2,
    "name": "个人",
    "color": "#2ecc71",
    "task_count": 3
  }
]
```

### 8. 更新分类

**接口**: `PUT /api/categories/:categoryId`

**测试用例**:

#### 成功案例
```bash
curl -X PUT http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/categories/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "工作任务",
    "color": "#e74c3c"
  }'
```

**成功返回值** (200):
```json
{
  "id": 1,
  "name": "工作任务",
  "color": "#e74c3c",
  "updated_at": "2024-01-15T12:00:00.000Z"
}
```

#### 失败案例

**分类不存在** (404):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "分类不存在"
  }
}
```

### 9. 删除分类

**接口**: `DELETE /api/categories/:categoryId`

**测试用例**:

#### 成功案例
```bash
curl -X DELETE http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/categories/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**成功返回值** (200):
```json
{
  "message": "分类删除成功"
}
```

## 任务管理接口

### 10. 创建任务

**接口**: `POST /api/tasks`

**测试用例**:

#### 成功案例
```bash
curl -X POST http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "完成项目文档",
    "description": "编写API文档和用户手册",
    "due_date": "2024-01-20T18:00:00.000Z",
    "priority": "high",
    "status": "pending",
    "category_ids": [1, 2]
  }'
```

**成功返回值** (201):
```json
{
  "id": 1,
  "title": "完成项目文档",
  "description": "编写API文档和用户手册",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "due_date": "2024-01-20T18:00:00.000Z",
  "priority": "high",
  "status": "pending",
  "user_id": 1,
  "categories": [
    {
      "id": 1,
      "name": "工作"
    },
    {
      "id": 2,
      "name": "个人"
    }
  ]
}
```

### 11. 获取任务列表

**接口**: `GET /api/tasks`

**测试用例**:

#### 成功案例（基础查询）
```bash
curl -X GET http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 成功案例（带筛选）
```bash
curl -X GET "http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/tasks?status=pending&priority=high&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**成功返回值** (200):
```json
{
  "data": [
    {
      "id": 1,
      "title": "完成项目文档",
      "due_date": "2024-01-20T18:00:00.000Z",
      "priority": "high",
      "status": "pending",
      "categories": ["工作", "个人"]
    },
    {
      "id": 2,
      "title": "购买生活用品",
      "due_date": "2024-01-18T12:00:00.000Z",
      "priority": "medium",
      "status": "pending",
      "categories": ["购物"]
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "total_pages": 2
  }
}
```

### 12. 获取单个任务详情

**接口**: `GET /api/tasks/:taskId`

**测试用例**:

#### 成功案例
```bash
curl -X GET http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/tasks/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**成功返回值** (200):
```json
{
  "id": 1,
  "title": "完成项目文档",
  "description": "编写API文档和用户手册",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "due_date": "2024-01-20T18:00:00.000Z",
  "priority": "high",
  "status": "pending",
  "user_id": 1,
  "categories": [
    {
      "id": 1,
      "name": "工作",
      "color": "#3498db"
    }
  ],
  "reminders": [
    {
      "id": 1,
      "remind_time": "2024-01-20T17:00:00.000Z",
      "is_sent": false
    }
  ],
  "attachments": [
    {
      "id": 1,
      "filename": "document.pdf",
      "original_name": "项目需求文档.pdf",
      "file_size": 1024000,
      "file_url": "/uploads/document.pdf"
    }
  ]
}
```

#### 失败案例

**任务不存在** (404):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "任务不存在"
  }
}
```

### 13. 更新任务

**接口**: `PUT /api/tasks/:taskId`

**测试用例**:

#### 成功案例
```bash
curl -X PUT http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/tasks/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "完成项目文档（已更新）",
    "status": "in_progress",
    "priority": "medium"
  }'
```

**成功返回值** (200):
```json
{
  "id": 1,
  "title": "完成项目文档（已更新）",
  "description": "编写API文档和用户手册",
  "updated_at": "2024-01-15T14:30:00.000Z",
  "due_date": "2024-01-20T18:00:00.000Z",
  "priority": "medium",
  "status": "in_progress",
  "categories": [
    {
      "id": 1,
      "name": "工作"
    }
  ]
}
```

### 14. 删除任务

**接口**: `DELETE /api/tasks/:taskId`

**测试用例**:

#### 成功案例
```bash
curl -X DELETE http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/tasks/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**成功返回值** (200):
```json
{
  "message": "任务删除成功"
}
```

### 15. 为任务添加提醒

**接口**: `POST /api/tasks/:taskId/reminders`

**测试用例**:

#### 成功案例
```bash
curl -X POST http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/tasks/1/reminders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "remind_time": "2024-01-20T17:00:00.000Z"
  }'
```

**成功返回值** (201):
```json
{
  "id": 1,
  "task_id": 1,
  "remind_time": "2024-01-20T17:00:00.000Z",
  "is_sent": false,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### 16. 上传任务附件

**接口**: `POST /api/tasks/:taskId/attachments`

**测试用例**:

#### 成功案例
```bash
curl -X POST http://devbox.ns-mutrnoyx.svc.cluster.local:3000/api/tasks/1/attachments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/your/file.pdf"
```

**成功返回值** (201):
```json
{
  "id": 1,
  "task_id": 1,
  "filename": "1642248600000_file.pdf",
  "original_name": "file.pdf",
  "file_size": 1024000,
  "file_url": "/uploads/1642248600000_file.pdf",
  "uploaded_at": "2024-01-15T10:30:00.000Z"
}
```

#### 失败案例

**文件太大** (400):
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "文件大小超过限制（5MB）"
  }
}
```

**文件类型不支持** (400):
```json
{
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "不支持的文件类型"
  }
}
```

## 通用错误响应

### 验证错误 (400)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "title",
        "message": "任务标题不能为空"
      }
    ]
  }
}
```

### 未授权 (401)
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "访问令牌无效或已过期"
  }
}
```

### 禁止访问 (403)
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "没有权限访问此资源"
  }
}
```

### 资源不存在 (404)
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "请求的资源不存在"
  }
}
```

### 服务器内部错误 (500)
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "服务器内部错误"
  }
}
```

## 测试流程建议

1. **注册用户** → 获取用户信息
2. **登录** → 获取访问令牌
3. **创建分类** → 获取分类列表
4. **创建任务** → 关联分类
5. **获取任务列表** → 验证筛选功能
6. **更新任务** → 验证状态变更
7. **添加提醒和附件** → 验证关联功能
8. **删除资源** → 验证清理功能

## 注意事项

- 所有需要认证的接口都需要在请求头中包含 `Authorization: Bearer <token>`
- 时间格式使用 ISO 8601 标准 (YYYY-MM-DDTHH:mm:ss.sssZ)
- 文件上传限制为 5MB
- 分页参数：page（页码，从1开始），limit（每页数量，1-100）
- 颜色格式为十六进制颜色代码（如：#3498db）