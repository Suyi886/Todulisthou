# Todo List 数据库设置指南

## 问题诊断

当前遇到的问题是MySQL数据库连接权限问题。以下是完整的解决方案：

## 解决步骤

### 1. 检查MySQL服务状态

```powershell
# 检查MySQL服务是否运行
Get-Service -Name "MySQL*"

# 如果服务未运行，启动MySQL服务
Start-Service -Name "MySQL80"  # 或者你的MySQL服务名称
```

### 2. 重置MySQL root密码（如果需要）

如果你忘记了MySQL root密码，可以按以下步骤重置：

1. 停止MySQL服务
2. 以安全模式启动MySQL
3. 重置root密码
4. 重启MySQL服务

### 3. 配置数据库连接

根据你的MySQL配置，更新 `.env` 文件：

```env
# 选项1：使用root用户（需要正确的密码）
DB_USER=root
DB_PASSWORD=你的root密码
DB_NAME=todulist

# 选项2：使用专用用户
DB_USER=tototo1
DB_PASSWORD=123456
DB_NAME=todulist
```

### 4. 手动创建数据库和用户

使用MySQL命令行或图形工具（如phpMyAdmin、MySQL Workbench）执行：

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS todulist;

-- 创建用户（如果使用专用用户）
CREATE USER IF NOT EXISTS 'tototo1'@'localhost' IDENTIFIED BY '123456';

-- 授予权限
GRANT ALL PRIVILEGES ON todulist.* TO 'tototo1'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

### 5. 验证连接

```bash
# 测试数据库连接
node test-db.js
```

### 6. 初始化数据库

连接成功后，运行：

```bash
# 初始化数据库表和数据
npm run db:init

# 应用数据库优化
npm run db:optimize
```

## 可用的数据库管理命令

```bash
# 设置数据库（创建数据库和用户）
npm run db:setup

# 初始化数据库（创建表和示例数据）
npm run db:init

# 优化数据库（添加索引和约束）
npm run db:optimize

# 重置数据库（重新初始化）
npm run db:reset

# 测试数据库连接
node test-db.js
```

## 常见问题解决

### 问题1：Access denied for user 'root'@'localhost'

**解决方案：**
- 确认MySQL root密码正确
- 更新 `.env` 文件中的 `DB_PASSWORD`
- 或者创建专用数据库用户

### 问题2：Unknown database 'todulist'

**解决方案：**
- 手动创建数据库：`CREATE DATABASE todulist;`
- 或运行：`npm run db:setup`

### 问题3：Can't connect to MySQL server

**解决方案：**
- 检查MySQL服务是否运行
- 确认端口3306是否正确
- 检查防火墙设置

## 推荐配置

为了避免权限问题，推荐使用以下配置：

```env
# .env 文件
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=todulist
```

## 成功标志

当数据库设置成功后，你应该看到：

```
=== 数据库连接测试 ===
✓ 数据库连接成功

=== 检查数据库表 ===
数据库表列表:
- users
- tasks
- categories
- task_categories
- reminders
- attachments

=== 检查用户数据 ===
用户总数: 3
前3个用户:
- demo_user (demo@example.com)
- alice_smith (alice@example.com)
- bob_johnson (bob@example.com)

🎉 数据库测试完成！
```

## 下一步

数据库设置完成后，你可以：

1. 启动应用服务器：`npm run dev`
2. 使用测试账户登录：
   - 用户名：`demo_user`
   - 密码：`Demo123!`
3. 开始使用Todo List应用

## 技术支持

如果仍然遇到问题，请检查：

1. MySQL版本兼容性
2. Node.js版本（推荐v16+）
3. 网络连接
4. 系统权限

参考 `DATABASE.md` 文件获取更多数据库架构信息。