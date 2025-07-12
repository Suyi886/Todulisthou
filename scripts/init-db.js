const { sequelize } = require('../config/db');
const { User, Task, Category, TaskCategory, Reminder, Attachment } = require('../models');

/**
 * 初始化数据库
 * 创建数据库表和初始数据
 */
async function initDatabase() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步数据库模型（创建表）
    await sequelize.sync({ force: true });
    console.log('数据库表创建成功');

    // 创建默认分类
    const defaultCategories = [
      { name: '工作', color: '#3498db', user_id: 1 },
      { name: '个人', color: '#2ecc71', user_id: 1 },
      { name: '购物', color: '#9b59b6', user_id: 1 },
      { name: '健康', color: '#e74c3c', user_id: 1 }
    ];

    // 创建测试用户
    const testUser = await User.create({
      username: 'test_user',
      email: 'test@example.com',
      password: 'Test123!'
    });

    // 创建默认分类
    await Category.bulkCreate(defaultCategories.map(category => ({
      ...category,
      user_id: testUser.id
    })));

    console.log('初始数据创建成功');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

// 执行初始化
initDatabase();