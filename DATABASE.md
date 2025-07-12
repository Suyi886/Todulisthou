# 数据库管理指南

本文档介绍了Todo List应用的数据库结构和管理方法。

## 🗄️ 数据库结构

### 核心表结构

#### 用户表 (users)
- `id` - 主键，自增
- `username` - 用户名，唯一
- `email` - 邮箱，唯一
- `password` - 密码（加密存储）
- `avatar_url` - 头像URL
- `timezone` - 用户时区
- `preferences` - 用户偏好设置（JSON格式）
- `is_active` - 账户是否激活
- `email_verified` - 邮箱是否已验证
- `last_login` - 最后登录时间
- `created_at` - 创建时间
- `updated_at` - 更新时间

#### 任务表 (tasks)
- `id` - 主键，自增
- `title` - 任务标题
- `description` - 任务描述
- `due_date` - 截止日期
- `priority` - 优先级 (low, medium, high)
- `status` - 状态 (pending, in_progress, completed, archived)
- `completion_date` - 完成时间
- `estimated_hours` - 预估工时
- `actual_hours` - 实际工时
- `user_id` - 用户ID（外键）
- `created_at` - 创建时间
- `updated_at` - 更新时间

#### 分类表 (categories)
- `id` - 主键，自增
- `name` - 分类名称
- `color` - 分类颜色
- `user_id` - 用户ID（外键）
- `created_at` - 创建时间
- `updated_at` - 更新时间

#### 任务分类关联表 (task_categories)
- `id` - 主键，自增
- `task_id` - 任务ID（外键）
- `category_id` - 分类ID（外键）
- `created_at` - 创建时间
- `updated_at` - 更新时间

#### 提醒表 (reminders)
- `id` - 主键，自增
- `task_id` - 任务ID（外键）
- `remind_time` - 提醒时间
- `reminded` - 是否已提醒
- `created_at` - 创建时间
- `updated_at` - 更新时间

#### 附件表 (attachments)
- `id` - 主键，自增
- `task_id` - 任务ID（外键）
- `filename` - 文件名
- `filetype` - 文件类型
- `filesize` - 文件大小
- `file_url` - 文件URL
- `upload_time` - 上传时间
- `created_at` - 创建时间
- `updated_at` - 更新时间

## 🚀 快速开始

### 1. 配置数据库连接

确保 `.env` 文件中的数据库配置正确：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=tototo1
DB_PASSWORD=123456
DB_NAME=Todulist
```

### 2. 初始化数据库

运行以下命令来创建完整的数据库结构和示例数据：

```bash
npm run db:init
```

这个命令会：
- ✅ 创建所有数据库表
- ✅ 添加性能优化索引
- ✅ 创建查询视图
- ✅ 添加示例用户和数据
- ✅ 设置外键约束

### 3. 示例账户

初始化完成后，可以使用以下账户登录：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | Admin123! | 管理员 |
| demo_user | Demo123! | 演示用户 |
| test_user | Test123! | 测试用户 |

## 🛠️ 数据库管理命令

### 初始化数据库
```bash
npm run db:init
```
完整初始化数据库，包括表结构、优化和示例数据。

### 仅优化数据库
```bash
npm run db:optimize
```
仅应用数据库优化（索引、视图、存储过程）。

### 重置数据库
```bash
npm run db:reset
```
重置数据库到初始状态。

## 📊 性能优化

### 索引策略

数据库包含以下性能优化索引：

- **用户表索引**：email, username, last_login
- **任务表索引**：user_id, status, priority, due_date, created_at
- **分类表索引**：user_id, name, 复合唯一索引(user_id, name)
- **关联表索引**：task_id, category_id, 复合唯一索引
- **提醒表索引**：task_id, remind_time, reminded
- **附件表索引**：task_id, filetype, upload_time

### 查询视图

#### task_summary 视图
提供任务的汇总信息，包括分类数量、提醒数量、附件数量等。

#### user_stats 视图
提供用户的统计信息，包括任务完成情况、分类数量等。

### 数据清理

系统包含自动数据清理存储过程：

```sql
CALL CleanupExpiredData();
```

这个存储过程会：
- 删除30天前已完成任务的提醒
- 删除90天前的已归档任务

建议定期运行此存储过程来保持数据库性能。

## 🔧 模型特性

### User 模型方法

- `validatePassword(password)` - 验证密码
- `getDisplayName()` - 获取显示名称
- `isOnline(minutesThreshold)` - 检查用户是否在线
- `updatePreferences(newPreferences)` - 更新用户偏好
- `getSafeUserInfo()` - 获取安全的用户信息
- `User.findActiveUsers(limit)` - 查找活跃用户

### Task 模型方法

- `isOverdue()` - 检查任务是否过期
- `getProgressPercentage()` - 获取任务进度百分比
- `getEfficiency()` - 计算工时效率
- `Task.getUserStats(userId)` - 获取用户任务统计

### 自动化功能

- **密码加密**：用户密码自动使用bcrypt加密
- **完成时间**：任务状态变为完成时自动设置完成时间
- **数据验证**：所有字段都有适当的验证规则

## 🔒 安全特性

- 密码使用bcrypt加密存储
- 外键约束确保数据完整性
- 字段验证防止无效数据
- 用户数据隔离（每个用户只能访问自己的数据）

## 📈 监控和维护

### 性能监控

可以通过以下查询监控数据库性能：

```sql
-- 查看用户统计
SELECT * FROM user_stats;

-- 查看任务摘要
SELECT * FROM task_summary WHERE user_id = ?;

-- 查看索引使用情况
SHOW INDEX FROM tasks;
```

### 备份建议

1. 定期备份数据库
2. 测试备份恢复流程
3. 监控数据库大小和性能
4. 定期运行数据清理程序

## 🆘 故障排除

### 常见问题

1. **连接失败**：检查数据库配置和服务状态
2. **权限错误**：确保数据库用户有足够权限
3. **表不存在**：运行 `npm run db:init` 重新初始化
4. **性能问题**：检查索引使用情况，运行数据清理

### 日志查看

开发环境下，Sequelize会输出SQL查询日志，可以用于调试和性能分析。

---

📝 **注意**：在生产环境中使用前，请确保：
- 更改默认密码
- 配置适当的数据库权限
- 设置定期备份
- 监控数据库性能