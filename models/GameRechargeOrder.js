const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GameRechargeOrder = sequelize.define('GameRechargeOrder', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID'
  },
  order_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '商户订单号'
  },
  platform_order_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '系统订单号'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '订单金额'
  },
  actual_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '实际收款金额'
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '国家编号'
  },
  api_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商户API密钥'
  },
  sign: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '签名'
  },
  syn_callback_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '同步跳转地址'
  },
  notify_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '回调地址'
  },
  pay_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '收银台地址'
  },
  callback_str: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '付款凭证字符串'
  },
  callback_img: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '付款凭证图片路径'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '订单状态：0-待付款，1-已提交凭证，10-成功，20-失败(未收到资金)，40-失败(资金冻结)，50-失败(资金返回)'
  },
  error_msg: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '错误信息'
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '提交凭证时间'
  },
  callback_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '回调时间'
  }
}, {
  tableName: 'game_recharge_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['order_id'],
      name: 'uk_order_id'
    },
    {
      fields: ['platform_order_id'],
      name: 'idx_platform_order_id'
    },
    {
      fields: ['status'],
      name: 'idx_status'
    },
    {
      fields: ['created_at'],
      name: 'idx_created_at'
    }
  ]
});

module.exports = GameRechargeOrder;