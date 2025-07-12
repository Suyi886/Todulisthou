const { sequelize } = require('../config/db');
const { User, Task, Category, TaskCategory, Reminder, Attachment } = require('../models');
const { optimizeDatabase } = require('./optimize-db');

/**
 * 完整的数据库初始化
 * 创建数据库表、优化结构和初始数据
 */
async function initDatabase() {
  try {
    console.log('🚀 开始初始化数据库...');
    
    // 1. 测试数据库连接
    await sequelize.authenticate();
    console.log('✓ 数据库连接成功');

    // 2. 同步数据库模型（创建表）
    await sequelize.sync({ force: true });
    console.log('✓ 数据库表创建成功');

    // 3. 应用数据库优化
    console.log('\n📊 开始应用数据库优化...');
    await optimizeDatabase();
    console.log('✓ 数据库优化完成');

    // 4. 创建示例用户
    console.log('\n👤 创建示例用户...');
    const users = await User.bulkCreate([
      {
        username: 'admin',
        email: 'admin@todolist.com',
        password: 'Admin123!',
        email_verified: true,
        preferences: {
          theme: 'dark',
          language: 'zh-CN',
          notifications: {
            email: true,
            push: true,
            reminder: true
          },
          task_view: 'grid'
        }
      },
      {
        username: 'demo_user',
        email: 'demo@todolist.com',
        password: 'Demo123!',
        email_verified: true,
        timezone: 'Asia/Shanghai'
      },
      {
        username: 'test_user',
        email: 'test@example.com',
        password: 'Test123!'
      }
    ]);
    console.log(`✓ 创建了 ${users.length} 个示例用户`);

    // 5. 为每个用户创建默认分类
    console.log('\n📁 创建默认分类...');
    const categoryTemplates = [
      { name: '工作', color: '#3498db' },
      { name: '个人', color: '#2ecc71' },
      { name: '购物', color: '#9b59b6' },
      { name: '健康', color: '#e74c3c' },
      { name: '学习', color: '#f39c12' },
      { name: '娱乐', color: '#1abc9c' }
    ];

    const categories = [];
    for (const user of users) {
      for (const template of categoryTemplates) {
        categories.push({
          ...template,
          user_id: user.id
        });
      }
    }
    await Category.bulkCreate(categories);
    console.log(`✓ 创建了 ${categories.length} 个分类`);

    // 6. 创建示例任务
    console.log('\n📝 创建示例任务...');
    const demoUser = users.find(u => u.username === 'demo_user');
    const userCategories = await Category.findAll({ where: { user_id: demoUser.id } });
    
    const sampleTasks = [
      {
        title: '完成项目文档',
        description: '编写项目的技术文档和用户手册',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
        priority: 'high',
        status: 'in_progress',
        estimated_hours: 8.5,
        actual_hours: 6.0,
        user_id: demoUser.id
      },
      {
        title: '购买生活用品',
        description: '购买洗发水、牙膏、纸巾等日用品',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
        priority: 'medium',
        status: 'pending',
        estimated_hours: 2.0,
        user_id: demoUser.id
      },
      {
        title: '健身计划',
        description: '制定下个月的健身计划和饮食安排',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14天后
        priority: 'medium',
        status: 'pending',
        estimated_hours: 3.0,
        user_id: demoUser.id
      },
      {
        title: '学习新技术',
        description: '学习React和Node.js的最新特性',
        priority: 'low',
        status: 'completed',
        completion_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前完成
        estimated_hours: 20.0,
        actual_hours: 18.5,
        user_id: demoUser.id
      }
    ];

    const tasks = await Task.bulkCreate(sampleTasks);
    console.log(`✓ 创建了 ${tasks.length} 个示例任务`);

    // 7. 创建任务分类关联
    console.log('\n🔗 创建任务分类关联...');
    const taskCategories = [
      { task_id: tasks[0].id, category_id: userCategories.find(c => c.name === '工作').id },
      { task_id: tasks[1].id, category_id: userCategories.find(c => c.name === '购物').id },
      { task_id: tasks[2].id, category_id: userCategories.find(c => c.name === '健康').id },
      { task_id: tasks[3].id, category_id: userCategories.find(c => c.name === '学习').id }
    ];
    await TaskCategory.bulkCreate(taskCategories);
    console.log(`✓ 创建了 ${taskCategories.length} 个任务分类关联`);

    // 8. 创建提醒
    console.log('\n⏰ 创建示例提醒...');
    const reminders = [
      {
        task_id: tasks[0].id,
        remind_time: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6天后提醒
        reminded: false
      },
      {
        task_id: tasks[1].id,
        remind_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后提醒
        reminded: false
      }
    ];
    await Reminder.bulkCreate(reminders);
    console.log(`✓ 创建了 ${reminders.length} 个提醒`);

    // 9. 显示统计信息
    console.log('\n📊 数据库统计信息:');
    const userCount = await User.count();
    const taskCount = await Task.count();
    const categoryCount = await Category.count();
    const reminderCount = await Reminder.count();
    
    console.log(`   用户数量: ${userCount}`);
    console.log(`   任务数量: ${taskCount}`);
    console.log(`   分类数量: ${categoryCount}`);
    console.log(`   提醒数量: ${reminderCount}`);

    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📋 示例账户信息:');
    console.log('   管理员: admin / Admin123!');
    console.log('   演示用户: demo_user / Demo123!');
    console.log('   测试用户: test_user / Test123!');
    console.log('\n💡 提示: 可以使用这些账户登录系统进行测试');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 执行初始化
initDatabase();