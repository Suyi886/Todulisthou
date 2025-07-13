const { sequelize } = require('./config/db');

async function testConnection() {
  try {
    console.log('正在测试数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功!');
    console.log('数据库配置:');
    console.log('- 主机:', process.env.DB_HOST);
    console.log('- 端口:', process.env.DB_PORT);
    console.log('- 用户名:', process.env.DB_USER);
    console.log('- 数据库名:', process.env.DB_NAME);
    
    // 测试查询
    const [results] = await sequelize.query('SELECT VERSION() as version');
    console.log('MySQL版本:', results[0].version);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error('错误信息:', error.message);
    console.error('错误代码:', error.code || 'N/A');
    console.error('完整错误:', error);
    process.exit(1);
  }
}

testConnection();