const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * 数据库设置脚本
 * 创建数据库和用户权限
 */
async function setupDatabase() {
  let connection;
  
  try {
    console.log('=== 数据库设置开始 ===');
    
    // 连接到MySQL服务器（不指定数据库）
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: 'root', // 使用root用户创建数据库
      password: process.env.DB_ROOT_PASSWORD || '', // 需要root密码
    });
    
    console.log('✓ 连接到MySQL服务器成功');
    
    // 创建数据库
    const dbName = process.env.DB_NAME || 'Todulist';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✓ 数据库 '${dbName}' 创建成功`);
    
    // 创建用户（如果不存在）
    const dbUser = process.env.DB_USER || 'tototo1';
    const dbPassword = process.env.DB_PASSWORD || '123456';
    
    try {
      await connection.execute(`CREATE USER IF NOT EXISTS '${dbUser}'@'localhost' IDENTIFIED BY '${dbPassword}'`);
      console.log(`✓ 用户 '${dbUser}' 创建成功`);
    } catch (error) {
      if (error.code === 'ER_CANNOT_USER') {
        console.log(`⚠ 用户 '${dbUser}' 已存在`);
      } else {
        throw error;
      }
    }
    
    // 授予权限
    await connection.execute(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'localhost'`);
    console.log(`✓ 权限授予成功`);
    
    // 刷新权限
    await connection.execute('FLUSH PRIVILEGES');
    console.log(`✓ 权限刷新成功`);
    
    console.log('\n🎉 数据库设置完成！');
    console.log(`数据库名称: ${dbName}`);
    console.log(`用户名: ${dbUser}`);
    console.log(`主机: ${process.env.DB_HOST || 'localhost'}`);
    
  } catch (error) {
    console.error('❌ 数据库设置失败:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n请确保：');
      console.error('1. MySQL服务正在运行');
      console.error('2. root用户密码正确');
      console.error('3. 设置环境变量 DB_ROOT_PASSWORD（如果root有密码）');
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('\n可以现在运行: npm run db:init');
      process.exit(0);
    })
    .catch((error) => {
      console.error('设置失败:', error.message);
      process.exit(1);
    });
}

module.exports = { setupDatabase };