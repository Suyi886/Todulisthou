#!/bin/bash

# 安装依赖
echo "安装依赖..."
npm install

# 等待数据库准备就绪
echo "等待数据库准备就绪..."
sleep 5

# 初始化数据库
echo "初始化数据库..."
node scripts/init-db.js

# 启动应用
echo "启动Todo List API应用..."
node server.js