const { sequelize } = require('../config/db');
const { User, Task, Category, TaskCategory, Reminder, Attachment, GameRechargeOrder, MerchantConfig, CallbackLog, CountryCode } = require('../models');

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

    // 创建游戏充值相关初始数据
    // 创建商户配置
    await MerchantConfig.bulkCreate([
      {
        merchant_id: 'merchant_001',
        api_key: 'api_key_001',
        secret_key: 'secret_key_001',
        callback_url: 'https://example.com/callback',
        status: 1
      }
    ]);

    // 创建国家编号配置
    await CountryCode.bulkCreate([
      { code: 'CN', name: '中国', currency: 'CNY', status: 1 },
      { code: 'US', name: '美国', currency: 'USD', status: 1 },
      { code: 'JP', name: '日本', currency: 'JPY', status: 1 },
      { code: 'KR', name: '韩国', currency: 'KRW', status: 1 },
      { code: 'TH', name: '泰国', currency: 'THB', status: 1 }
    ]);

    console.log('Todo List初始数据创建成功');
    console.log('游戏充值平台初始数据创建成功');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

// 执行初始化
initDatabase();