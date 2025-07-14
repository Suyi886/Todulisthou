const { Op } = require('sequelize');
const { MerchantConfig } = require('../../models');
const { sequelize } = require('../../config/db');
const crypto = require('crypto');

/**
 * 生成API密钥
 */
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 生成密钥
 */
function generateSecretKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 获取商户配置列表
 * @route GET /api/game-recharge/merchants
 */
exports.getMerchants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (req.query.status !== undefined) {
      whereClause.status = parseInt(req.query.status);
    }
    if (req.query.merchant_id) {
      whereClause.merchant_id = {
        [Op.like]: `%${req.query.merchant_id}%`
      };
    }
    
    const { count, rows } = await MerchantConfig.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'merchant_id', 'api_key', 'status', 'callback_url', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
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
    console.error('获取商户列表失败:', error);
    next(error);
  }
};

/**
 * 创建商户配置
 * @route POST /api/game-recharge/merchants
 */
exports.createMerchant = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { merchant_id, callback_url } = req.body;
    
    // 验证必填参数
    if (!merchant_id) {
      return res.status(400).json({
        status: 'error',
        msg: '商户ID不能为空',
        code: 400
      });
    }
    
    // 检查商户ID是否已存在
    const existingMerchant = await MerchantConfig.findOne({
      where: { merchant_id },
      transaction
    });
    
    if (existingMerchant) {
      return res.status(400).json({
        status: 'error',
        msg: '商户ID已存在',
        code: 400
      });
    }
    
    // 生成API密钥和签名密钥
    const api_key = generateApiKey();
    const secret_key = generateSecretKey();
    
    // 创建商户配置
    const merchant = await MerchantConfig.create({
      merchant_id,
      api_key,
      secret_key,
      callback_url: callback_url || '',
      status: 1
    }, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '商户创建成功',
      data: {
        id: merchant.id,
        merchant_id: merchant.merchant_id,
        api_key: merchant.api_key,
        secret_key: merchant.secret_key,
        callback_url: merchant.callback_url,
        status: merchant.status
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('创建商户失败:', error);
    next(error);
  }
};

/**
 * 更新商户配置
 * @route PUT /api/game-recharge/merchants/:id
 */
exports.updateMerchant = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { merchant_id, callback_url } = req.body;
    
    // 查找商户
    const merchant = await MerchantConfig.findByPk(id, { transaction });
    
    if (!merchant) {
      return res.status(404).json({
        status: 'error',
        msg: '商户不存在',
        code: 404
      });
    }
    
    // 如果修改了商户ID，检查是否重复
    if (merchant_id && merchant_id !== merchant.merchant_id) {
      const existingMerchant = await MerchantConfig.findOne({
        where: {
          merchant_id,
          id: { [Op.ne]: id }
        },
        transaction
      });
      
      if (existingMerchant) {
        return res.status(400).json({
          status: 'error',
          msg: '商户ID已存在',
          code: 400
        });
      }
    }
    
    // 更新商户信息
    const updateData = {};
    if (merchant_id) updateData.merchant_id = merchant_id;
    if (callback_url !== undefined) updateData.callback_url = callback_url;
    
    await merchant.update(updateData, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '商户更新成功',
      data: {
        id: merchant.id,
        merchant_id: merchant.merchant_id,
        api_key: merchant.api_key,
        callback_url: merchant.callback_url,
        status: merchant.status
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('更新商户失败:', error);
    next(error);
  }
};

/**
 * 删除商户配置
 * @route DELETE /api/game-recharge/merchants/:id
 */
exports.deleteMerchant = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // 查找商户
    const merchant = await MerchantConfig.findByPk(id, { transaction });
    
    if (!merchant) {
      return res.status(404).json({
        status: 'error',
        msg: '商户不存在',
        code: 404
      });
    }
    
    // 删除商户
    await merchant.destroy({ transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '商户删除成功'
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('删除商户失败:', error);
    next(error);
  }
};

/**
 * 切换商户状态
 * @route PUT /api/game-recharge/merchants/:id/status
 */
exports.toggleMerchantStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // 查找商户
    const merchant = await MerchantConfig.findByPk(id, { transaction });
    
    if (!merchant) {
      return res.status(404).json({
        status: 'error',
        msg: '商户不存在',
        code: 404
      });
    }
    
    // 切换状态
    const newStatus = merchant.status === 1 ? 0 : 1;
    await merchant.update({ status: newStatus }, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: `商户${newStatus === 1 ? '启用' : '禁用'}成功`,
      data: {
        id: merchant.id,
        status: newStatus
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('切换商户状态失败:', error);
    next(error);
  }
};

/**
 * 重新生成商户密钥
 * @route PUT /api/game-recharge/merchants/:id/regenerate-keys
 */
exports.regenerateMerchantKeys = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // 查找商户
    const merchant = await MerchantConfig.findByPk(id, { transaction });
    
    if (!merchant) {
      return res.status(404).json({
        status: 'error',
        msg: '商户不存在',
        code: 404
      });
    }
    
    // 生成新的密钥
    const api_key = generateApiKey();
    const secret_key = generateSecretKey();
    
    await merchant.update({
      api_key,
      secret_key
    }, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '密钥重新生成成功',
      data: {
        id: merchant.id,
        api_key: merchant.api_key,
        secret_key: merchant.secret_key
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('重新生成密钥失败:', error);
    next(error);
  }
};