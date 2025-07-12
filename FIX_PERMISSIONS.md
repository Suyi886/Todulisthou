# 修复数据库权限问题

## 当前问题

用户 `tototo1` 已经创建成功，但没有访问 `todulist` 数据库的权限。

## 解决步骤

### 1. 在MySQL命令行中执行以下命令

```sql
-- 首先确保以root用户登录MySQL
-- mysql -u root -p

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS todulist;

-- 授予权限（注意：这是正确的语法）
GRANT ALL PRIVILEGES ON todulist.* TO 'tototo1'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 验证权限
SHOW GRANTS FOR 'tototo1'@'localhost';
```

### 2. 验证权限设置

执行 `SHOW GRANTS FOR 'tototo1'@'localhost';` 后，您应该看到类似这样的输出：

```
+-----------------------------------------------------------------------+
| Grants for tototo1@localhost                                         |
+-----------------------------------------------------------------------+
| GRANT USAGE ON *.* TO `tototo1`@`localhost`                          |
| GRANT ALL PRIVILEGES ON `todulist`.* TO `tototo1`@`localhost`        |
+-----------------------------------------------------------------------+
```

### 3. 测试连接

权限设置完成后，运行以下命令测试连接：

```bash
node -e "const { sequelize } = require('./config/db'); sequelize.authenticate().then(() => console.log('✓ 连接成功')).catch(err => console.error('❌ 连接失败:', err.message)).finally(() => process.exit());"
```

### 4. 初始化数据库

连接成功后，运行：

```bash
npm run db:init
```

## 常见问题排查

### 问题1：仍然提示权限被拒绝

**可能原因：**
- 权限没有正确刷新
- 数据库名称大小写问题

**解决方案：**
```sql
-- 重新授权，确保数据库名称正确
GRANT ALL PRIVILEGES ON `todulist`.* TO 'tototo1'@'localhost';
FLUSH PRIVILEGES;

-- 或者尝试使用通配符
GRANT ALL PRIVILEGES ON *.* TO 'tototo1'@'localhost';
FLUSH PRIVILEGES;
```

### 问题2：MySQL语法错误

您之前遇到的错误是因为在MySQL命令行中混入了PowerShell命令。请确保：

- 在MySQL命令行中只执行SQL语句
- 每条SQL语句以分号(;)结尾
- 不要在MySQL中执行PowerShell命令如 `Get-Service`

### 问题3：数据库不存在

如果提示数据库不存在，先创建数据库：

```sql
CREATE DATABASE todulist CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 快速修复脚本

我已经为您创建了 `scripts/grant-permissions.sql` 文件，您可以：

1. 以root用户登录MySQL：`mysql -u root -p`
2. 执行脚本：`source d:/study/app/Todulisthou/scripts/grant-permissions.sql`

或者逐行复制粘贴SQL命令到MySQL命令行中执行。

## 验证成功标志

当权限设置成功后，您应该能看到：

```
✓ 数据库连接成功！用户tototo1可以访问todulist数据库
```

然后就可以正常运行 `npm run db:init` 初始化数据库了。