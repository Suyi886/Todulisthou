const User = require('./User');
const Task = require('./Task');
const Category = require('./Category');
const TaskCategory = require('./TaskCategory');
const Reminder = require('./Reminder');
const Attachment = require('./Attachment');

// 用户与任务的关系：一对多
User.hasMany(Task, { foreignKey: 'user_id', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 用户与分类的关系：一对多
User.hasMany(Category, { foreignKey: 'user_id', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 任务与分类的关系：多对多
Task.belongsToMany(Category, { through: TaskCategory, foreignKey: 'task_id', as: 'categories' });
Category.belongsToMany(Task, { through: TaskCategory, foreignKey: 'category_id', as: 'tasks' });

// 任务与提醒的关系：一对多
Task.hasMany(Reminder, { foreignKey: 'task_id', as: 'reminders' });
Reminder.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

// 任务与附件的关系：一对多
Task.hasMany(Attachment, { foreignKey: 'task_id', as: 'attachments' });
Attachment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

module.exports = {
  User,
  Task,
  Category,
  TaskCategory,
  Reminder,
  Attachment
};