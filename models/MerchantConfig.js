const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MerchantConfig = sequelize.define('MerchantConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID'
  },
  merchant_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '商户ID'
  },
  api_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'API密钥'
  },
  secret_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '签名密钥'
  },
  callback_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '默认回调地址'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：1-启用，0-禁用'
  }
}, {
  tableName: 'merchant_config',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['merchant_id'],
      name: 'uk_merchant_id'
    },
    {
      unique: true,
      fields: ['api_key'],
      name: 'uk_api_key'
    }
  ]
});

module.exports = MerchantConfig;