const { sequelize } = require('../config/db');
const { User, Task, Category, TaskCategory, Reminder, Attachment } = require('../models');

/**
 * 数据库优化脚本
 * 添加索引、约束和性能优化
 */
async function optimizeDatabase() {
  try {
    console.log('开始数据库优化...');

    // 1. 为用户表添加索引
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
    `);
    console.log('✓ 用户表索引创建完成');

    // 2. 为任务表添加索引
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON tasks(user_id, priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_title_fulltext ON tasks(title);
    `);
    console.log('✓ 任务表索引创建完成');

    // 3. 为分类表添加索引
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name ON categories(user_id, name);
    `);
    console.log('✓ 分类表索引创建完成');

    // 4. 为任务分类关联表添加索引
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_task_categories_task_id ON task_categories(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_categories_category_id ON task_categories(category_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_task_categories_unique ON task_categories(task_id, category_id);
    `);
    console.log('✓ 任务分类关联表索引创建完成');

    // 5. 为提醒表添加索引
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id);
      CREATE INDEX IF NOT EXISTS idx_reminders_remind_time ON reminders(remind_time);
      CREATE INDEX IF NOT EXISTS idx_reminders_reminded ON reminders(reminded);
      CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(remind_time, reminded);
    `);
    console.log('✓ 提醒表索引创建完成');

    // 6. 为附件表添加索引
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_filetype ON attachments(filetype);
      CREATE INDEX IF NOT EXISTS idx_attachments_upload_time ON attachments(upload_time);
    `);
    console.log('✓ 附件表索引创建完成');

    // 7. 添加外键约束（如果不存在）
    try {
      await sequelize.query(`
        ALTER TABLE tasks 
        ADD CONSTRAINT IF NOT EXISTS fk_tasks_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
      
      await sequelize.query(`
        ALTER TABLE categories 
        ADD CONSTRAINT IF NOT EXISTS fk_categories_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
      
      await sequelize.query(`
        ALTER TABLE task_categories 
        ADD CONSTRAINT IF NOT EXISTS fk_task_categories_task_id 
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
      `);
      
      await sequelize.query(`
        ALTER TABLE task_categories 
        ADD CONSTRAINT IF NOT EXISTS fk_task_categories_category_id 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
      `);
      
      await sequelize.query(`
        ALTER TABLE reminders 
        ADD CONSTRAINT IF NOT EXISTS fk_reminders_task_id 
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
      `);
      
      await sequelize.query(`
        ALTER TABLE attachments 
        ADD CONSTRAINT IF NOT EXISTS fk_attachments_task_id 
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
      `);
      
      console.log('✓ 外键约束添加完成');
    } catch (error) {
      console.log('⚠ 外键约束可能已存在，跳过...');
    }

    // 8. 创建视图以提高查询性能
    await sequelize.query(`
      CREATE OR REPLACE VIEW task_summary AS
      SELECT 
        t.id,
        t.title,
        t.description,
        t.due_date,
        t.priority,
        t.status,
        t.user_id,
        t.created_at,
        t.updated_at,
        u.username,
        COUNT(DISTINCT tc.category_id) as category_count,
        COUNT(DISTINCT r.id) as reminder_count,
        COUNT(DISTINCT a.id) as attachment_count,
        GROUP_CONCAT(DISTINCT c.name) as category_names
      FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN task_categories tc ON t.id = tc.task_id
      LEFT JOIN categories c ON tc.category_id = c.id
      LEFT JOIN reminders r ON t.id = r.task_id
      LEFT JOIN attachments a ON t.id = a.task_id
      GROUP BY t.id, t.title, t.description, t.due_date, t.priority, t.status, t.user_id, t.created_at, t.updated_at, u.username;
    `);
    console.log('✓ 任务摘要视图创建完成');

    // 9. 创建用户统计视图
    await sequelize.query(`
      CREATE OR REPLACE VIEW user_stats AS
      SELECT 
        u.id,
        u.username,
        u.email,
        u.created_at,
        u.last_login,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as pending_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
        COUNT(DISTINCT c.id) as total_categories,
        COUNT(DISTINCT r.id) as total_reminders
      FROM users u
      LEFT JOIN tasks t ON u.id = t.user_id
      LEFT JOIN categories c ON u.id = c.user_id
      LEFT JOIN reminders r ON t.id = r.task_id
      GROUP BY u.id, u.username, u.email, u.created_at, u.last_login;
    `);
    console.log('✓ 用户统计视图创建完成');

    // 10. 创建存储过程用于清理过期数据
    await sequelize.query(`
      DELIMITER //
      CREATE PROCEDURE IF NOT EXISTS CleanupExpiredData()
      BEGIN
        -- 删除30天前已完成的任务的提醒
        DELETE r FROM reminders r
        INNER JOIN tasks t ON r.task_id = t.id
        WHERE t.status = 'completed' 
        AND t.updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
        
        -- 删除90天前的已归档任务
        DELETE FROM tasks 
        WHERE status = 'archived' 
        AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
        
        -- 更新统计信息
        SELECT ROW_COUNT() as affected_rows;
      END //
      DELIMITER ;
    `);
    console.log('✓ 数据清理存储过程创建完成');

    console.log('\n🎉 数据库优化完成！');
    console.log('\n优化内容包括：');
    console.log('- ✓ 添加了性能索引');
    console.log('- ✓ 强化了外键约束');
    console.log('- ✓ 创建了查询视图');
    console.log('- ✓ 添加了数据清理程序');
    console.log('\n建议定期运行 CALL CleanupExpiredData(); 来清理过期数据');
    
  } catch (error) {
    console.error('❌ 数据库优化失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  optimizeDatabase()
    .then(() => {
      console.log('优化完成，退出程序');
      process.exit(0);
    })
    .catch((error) => {
      console.error('优化失败:', error);
      process.exit(1);
    });
}

module.exports = { optimizeDatabase };