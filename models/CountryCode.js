const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CountryCode = sequelize.define('CountryCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID'
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '国家编号'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '国家名称'
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: '货币编号'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：1-启用，0-禁用'
  }
}, {
  tableName: 'country_codes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['code'],
      name: 'uk_code'
    }
  ]
});

module.exports = CountryCode;