const User = require('./User');
const Task = require('./Task');
const Category = require('./Category');
const TaskCategory = require('./TaskCategory');
const Reminder = require('./Reminder');
const Attachment = require('./Attachment');

// 游戏充值相关模型
const GameRechargeOrder = require('./GameRechargeOrder');
const MerchantConfig = require('./MerchantConfig');
const CallbackLog = require('./CallbackLog');
const CountryCode = require('./CountryCode');

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

// 游戏充值订单与商户配置的关系：多对一
MerchantConfig.hasMany(GameRechargeOrder, { foreignKey: 'api_key', sourceKey: 'api_key', as: 'orders' });
GameRechargeOrder.belongsTo(MerchantConfig, { foreignKey: 'api_key', targetKey: 'api_key', as: 'merchant' });

// 游戏充值订单与回调记录的关系：一对多
GameRechargeOrder.hasMany(CallbackLog, { foreignKey: 'order_id', sourceKey: 'order_id', as: 'callbacks' });
CallbackLog.belongsTo(GameRechargeOrder, { foreignKey: 'order_id', targetKey: 'order_id', as: 'order' });

// 游戏充值订单与国家编号的关系：多对一
CountryCode.hasMany(GameRechargeOrder, { foreignKey: 'code', sourceKey: 'code', as: 'orders' });
GameRechargeOrder.belongsTo(CountryCode, { foreignKey: 'code', targetKey: 'code', as: 'country' });

module.exports = {
  User,
  Task,
  Category,
  TaskCategory,
  Reminder,
  Attachment,
  GameRechargeOrder,
  MerchantConfig,
  CallbackLog,
  CountryCode
};