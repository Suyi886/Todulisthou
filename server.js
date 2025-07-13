const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// 导入路由
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const taskRoutes = require('./routes/task.routes');
const categoryRoutes = require('./routes/category.routes');
const reminderRoutes = require('./routes/reminder.routes');
const attachmentRoutes = require('./routes/attachment.routes');
const gameRechargeRoutes = require('./routes/gameRecharge.routes');

// 初始化Express应用
const app = express();

// 中间件
// CORS配置 - 允许前端域名访问
const corsOptions = {
  origin: [
    'https://nlxyvnovonfl.sealosbja.site',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// 根路径重定向到API文档页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/game-recharge', gameRechargeRoutes);

// 错误处理中间件
app.use(errorHandler);

// 设置端口
const PORT = process.env.PORT || 3000;

// 数据库连接和服务器启动
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步数据库模型（开发环境可使用，生产环境应谨慎）
    // await sequelize.sync({ alter: true });
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`服务器地址: http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('无法连接到数据库:', error);
  }
}

startServer();