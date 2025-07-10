# Todo List API

基于 Node.js、Express 和 MySQL 的 Todo List RESTful API。

## 功能特性

- 用户认证（注册、登录）
- 任务管理（创建、查询、更新、删除）
- 分类管理（创建、查询、更新、删除）
- 提醒功能
- 附件上传

## 技术栈

- Node.js
- Express.js
- MySQL
- Sequelize ORM
- JWT 认证
- Multer 文件上传

## 安装与运行

### 前提条件

- Node.js (v14+)
- MySQL (v5.7+)

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 文件为 `.env`，并根据实际情况修改配置：

```
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=test-db-mysql.ns-mutrnoyx.svc
DB_PORT=3306
DB_USER=root
DB_PASSWORD=xvb69ffz
DB_NAME=todo_list_db

# JWT配置
JWT_SECRET=todo_list_secret_key
JWT_EXPIRES_IN=3600

# 文件上传配置
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880 # 5MB
```

### 初始化数据库

```bash
node scripts/init-db.js
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API 文档

### 认证 API

#### 用户注册

```
POST /api/auth/register
```

请求体：

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

#### 用户登录

```
POST /api/auth/login
```

请求体：

```json
{
  "username": "john_doe",
  "password": "Password123!"
}
```

### 任务 API

#### 创建任务

```
POST /api/tasks
```

请求体：

```json
{
  "title": "项目会议",
  "description": "与团队讨论项目进度",
  "due_date": "2023-12-15T14:00:00Z",
  "priority": "high",
  "status": "pending",
  "category_ids": [1]
}
```

#### 获取任务列表

```
GET /api/tasks?status=pending&priority=high&page=1&limit=10
```

#### 获取任务详情

```
GET /api/tasks/1
```

#### 更新任务

```
PUT /api/tasks/1
```

请求体：

```json
{
  "title": "项目会议 - 更新",
  "status": "in_progress"
}
```

#### 删除任务

```
DELETE /api/tasks/1
```

### 分类 API

#### 创建分类

```
POST /api/categories
```

请求体：

```json
{
  "name": "健康",
  "color": "#e74c3c"
}
```

#### 获取分类列表

```
GET /api/categories
```

#### 更新分类

```
PUT /api/categories/1
```

请求体：

```json
{
  "color": "#8e44ad"
}
```

#### 删除分类

```
DELETE /api/categories/1
```

### 提醒 API

#### 添加提醒

```
POST /api/tasks/1/reminders
```

请求体：

```json
{
  "remind_time": "2023-12-15T13:30:00Z"
}
```

#### 更新提醒

```
PUT /api/reminders/1
```

请求体：

```json
{
  "remind_time": "2023-12-15T13:00:00Z"
}
```

#### 删除提醒

```
DELETE /api/reminders/1
```

### 附件 API

#### 上传附件

```
POST /api/tasks/1/attachments
```

请求格式：`multipart/form-data`

参数：
- `file`: 文件对象

#### 删除附件

```
DELETE /api/attachments/1
```

## 错误处理

所有错误响应均遵循以下格式：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "详细错误信息"
  }
}
```

常见错误码：

| HTTP状态码 | 错误码 | 描述 |
|------------|---------|------|
| 400 | VALIDATION_ERROR | 输入数据验证失败 |
| 401 | INVALID_TOKEN | Token无效或过期 |
| 403 | FORBIDDEN | 无权访问该资源 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | DUPLICATE_ENTITY | 重复创建（如用户名重复） |
| 500 | INTERNAL_ERROR | 服务器内部错误 |