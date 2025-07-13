const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CallbackLog = sequelize.define('CallbackLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID'
  },
  order_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商户订单号'
  },
  platform_order_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '系统订单号'
  },
  callback_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '回调地址'
  },
  callback_data: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '回调数据'
  },
  response_code: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '响应状态码'
  },
  response_body: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '响应内容'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '回调状态：0-失败，1-成功'
  },
  retry_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '重试次数'
  }
}, {
  tableName: 'callback_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['order_id'],
      name: 'idx_order_id'
    },
    {
      fields: ['platform_order_id'],
      name: 'idx_platform_order_id'
    },
    {
      fields: ['created_at'],
      name: 'idx_created_at'
    }
  ]
});

module.exports = CallbackLog;