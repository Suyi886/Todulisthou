const { Op } = require('sequelize');
const { CountryCode } = require('../../models');
const { sequelize } = require('../../config/db');

/**
 * 获取国家编号列表
 * @route GET /api/game-recharge/countries
 */
exports.getCountries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (req.query.status !== undefined) {
      whereClause.status = parseInt(req.query.status);
    }
    if (req.query.code) {
      whereClause.code = {
        [Op.like]: `%${req.query.code}%`
      };
    }
    if (req.query.name) {
      whereClause.name = {
        [Op.like]: `%${req.query.name}%`
      };
    }
    
    // 如果没有分页参数，返回所有启用的国家（用于下拉选择）
    if (!req.query.page && !req.query.limit) {
      const countries = await CountryCode.findAll({
        where: { status: 1 },
        attributes: ['code', 'name', 'currency'],
        order: [['name', 'ASC']]
      });
      
      return res.json({
        status: 'success',
        data: countries
      });
    }
    
    const { count, rows } = await CountryCode.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'code', 'name', 'currency', 'status', 'created_at', 'updated_at'],
      order: [['name', 'ASC']],
      limit: limit,
      offset: offset
    });
    
    res.json({
      status: 'success',
      data: rows,
      page: page,
      limit: limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    });
    
  } catch (error) {
    console.error('获取国家列表失败:', error);
    next(error);
  }
};

/**
 * 创建国家配置
 * @route POST /api/game-recharge/countries
 */
exports.createCountry = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { code, name, currency } = req.body;
    
    // 验证必填参数
    if (!code || !name || !currency) {
      return res.status(400).json({
        status: 'error',
        msg: '国家编号、名称和货币不能为空',
        code: 400
      });
    }
    
    // 检查国家编号是否已存在
    const existingCountry = await CountryCode.findOne({
      where: { code },
      transaction
    });
    
    if (existingCountry) {
      return res.status(400).json({
        status: 'error',
        msg: '国家编号已存在',
        code: 400
      });
    }
    
    // 创建国家配置
    const country = await CountryCode.create({
      code: code.toUpperCase(),
      name,
      currency: currency.toUpperCase(),
      status: 1
    }, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '国家创建成功',
      data: {
        id: country.id,
        code: country.code,
        name: country.name,
        currency: country.currency,
        status: country.status
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('创建国家失败:', error);
    next(error);
  }
};

/**
 * 更新国家配置
 * @route PUT /api/game-recharge/countries/:id
 */
exports.updateCountry = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { code, name, currency } = req.body;
    
    // 查找国家
    const country = await CountryCode.findByPk(id, { transaction });
    
    if (!country) {
      return res.status(404).json({
        status: 'error',
        msg: '国家不存在',
        code: 404
      });
    }
    
    // 如果修改了国家编号，检查是否重复
    if (code && code !== country.code) {
      const existingCountry = await CountryCode.findOne({
        where: {
          code: code.toUpperCase(),
          id: { [Op.ne]: id }
        },
        transaction
      });
      
      if (existingCountry) {
        return res.status(400).json({
          status: 'error',
          msg: '国家编号已存在',
          code: 400
        });
      }
    }
    
    // 更新国家信息
    const updateData = {};
    if (code) updateData.code = code.toUpperCase();
    if (name) updateData.name = name;
    if (currency) updateData.currency = currency.toUpperCase();
    
    await country.update(updateData, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '国家更新成功',
      data: {
        id: country.id,
        code: country.code,
        name: country.name,
        currency: country.currency,
        status: country.status
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('更新国家失败:', error);
    next(error);
  }
};

/**
 * 删除国家配置
 * @route DELETE /api/game-recharge/countries/:id
 */
exports.deleteCountry = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // 查找国家
    const country = await CountryCode.findByPk(id, { transaction });
    
    if (!country) {
      return res.status(404).json({
        status: 'error',
        msg: '国家不存在',
        code: 404
      });
    }
    
    // 检查是否有关联的订单
    const { GameRechargeOrder } = require('../../models');
    const orderCount = await GameRechargeOrder.count({
      where: { code: country.code },
      transaction
    });
    
    if (orderCount > 0) {
      return res.status(400).json({
        status: 'error',
        msg: '该国家下存在订单记录，无法删除',
        code: 400
      });
    }
    
    // 删除国家
    await country.destroy({ transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '国家删除成功'
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('删除国家失败:', error);
    next(error);
  }
};

/**
 * 切换国家状态
 * @route PUT /api/game-recharge/countries/:id/status
 */
exports.toggleCountryStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // 查找国家
    const country = await CountryCode.findByPk(id, { transaction });
    
    if (!country) {
      return res.status(404).json({
        status: 'error',
        msg: '国家不存在',
        code: 404
      });
    }
    
    // 切换状态
    const newStatus = country.status === 1 ? 0 : 1;
    await country.update({ status: newStatus }, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: `国家${newStatus === 1 ? '启用' : '禁用'}成功`,
      data: {
        id: country.id,
        status: newStatus
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('切换国家状态失败:', error);
    next(error);
  }
};

/**
 * 获取单个国家详情
 * @route GET /api/game-recharge/countries/:id
 */
exports.getCountryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const country = await CountryCode.findByPk(id, {
      attributes: ['id', 'code', 'name', 'currency', 'status', 'created_at', 'updated_at']
    });
    
    if (!country) {
      return res.status(404).json({
        status: 'error',
        msg: '国家不存在',
        code: 404
      });
    }
    
    res.json({
      status: 'success',
      data: country
    });
    
  } catch (error) {
    console.error('获取国家详情失败:', error);
    next(error);
  }
};