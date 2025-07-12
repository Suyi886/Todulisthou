-- 数据库权限设置脚本
-- 请在MySQL命令行中逐行执行以下命令

-- 1. 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS todulist;

-- 2. 授予用户tototo1对todulist数据库的所有权限
GRANT ALL PRIVILEGES ON todulist.* TO 'tototo1'@'localhost';

-- 3. 刷新权限
FLUSH PRIVILEGES;

-- 4. 验证权限设置
SHOW GRANTS FOR 'tototo1'@'localhost';

-- 5. 切换到todulist数据库
USE todulist;

-- 6. 显示当前数据库
SELECT DATABASE();