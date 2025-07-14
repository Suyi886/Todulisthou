const crypto = require('crypto');
const { Op } = require('sequelize');
const { GameRechargeOrder, MerchantConfig, CallbackLog, CountryCode } = require('../models');
const { sequelize } = require('../config/db');

/**
 * 生成平台订单号
 */
function generatePlatformOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `P${timestamp}${random}`;
}

/**
 * 验证签名
 * @param {Object} params - 参数对象
 * @param {string} secretKey - 密钥
 * @param {string} receivedSign - 接收到的签名
 */
function verifySign(params, secretKey, receivedSign) {
  // 排除sign字段，按字母顺序排序
  const sortedParams = Object.keys(params)
    .filter(key => key !== 'sign' && params[key] !== undefined && params[key] !== '')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const signString = `${sortedParams}&key=${secretKey}`;
  const calculatedSign = crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
  
  return calculatedSign === receivedSign.toUpperCase();
}

/**
 * 创建订单接口
 * @route POST /api/game-recharge/createOrderMain
 */
exports.createOrderMain = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { order_id, amount, code, api_key, sign, syn_callback_url, notify_url } = req.body;
    
    // 验证必填参数
    if (!order_id || !amount || !code || !api_key || !sign) {
      return res.status(400).json({
        status: 'error',
        msg: '缺少必填参数',
        code: 400,
        data: {}
      });
    }
    
    // 验证商户配置
    const merchant = await MerchantConfig.findOne({
      where: { api_key, status: 1 },
      transaction
    });
    
    if (!merchant) {
      return res.status(400).json({
        status: 'error',
        msg: '无效的API密钥或商户已禁用',
        code: 400,
        data: {}
      });
    }
    
    // 验证签名
    if (!verifySign(req.body, merchant.secret_key, sign)) {
      return res.status(400).json({
        status: 'error',
        msg: '签名验证失败',
        code: 400,
        data: {}
      });
    }
    
    // 验证国家编号
    const country = await CountryCode.findOne({
      where: { code, status: 1 },
      transaction
    });
    
    if (!country) {
      return res.status(400).json({
        status: 'error',
        msg: '无效的国家编号',
        code: 400,
        data: {}
      });
    }
    
    // 检查订单是否已存在
    const existingOrder = await GameRechargeOrder.findOne({
      where: { order_id },
      transaction
    });
    
    if (existingOrder) {
      return res.status(400).json({
        status: 'error',
        msg: '订单号已存在',
        code: 400,
        data: {}
      });
    }
    
    // 生成平台订单号和支付链接
    const platform_order_id = generatePlatformOrderId();
    const pay_url = `https://cashier.example.com/pay/${platform_order_id}`;
    
    // 创建订单
    const order = await GameRechargeOrder.create({
      order_id,
      platform_order_id,
      amount,
      code,
      api_key,
      sign,
      syn_callback_url,
      notify_url: notify_url || merchant.callback_url,
      pay_url,
      status: 0
    }, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: 'success',
      data: {
        platform_order_id,
        amount: parseFloat(amount),
        pay_url
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('创建订单失败:', error);
    next(error);
  }
};

/**
 * 提交订单接口
 * @route POST /api/game-recharge/submitOrder
 */
exports.submitOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { order_id, platform_order_id, callback_str, api_key, sign } = req.body;
    const callback_img = req.file ? req.file.path : null;
    
    // 验证必填参数
    if (!order_id || !platform_order_id || !api_key || !sign) {
      return res.status(400).json({
        status: 'error',
        msg: '缺少必填参数',
        code: 400,
        data: {}
      });
    }
    
    // 验证凭证参数（二选一）
    if (!callback_str && !callback_img) {
      return res.status(400).json({
        status: 'error',
        msg: '必须提供付款凭证字符串或图片',
        code: 400,
        data: {}
      });
    }
    
    // 验证商户配置
    const merchant = await MerchantConfig.findOne({
      where: { api_key, status: 1 },
      transaction
    });
    
    if (!merchant) {
      return res.status(400).json({
        status: 'error',
        msg: '无效的API密钥或商户已禁用',
        code: 400,
        data: {}
      });
    }
    
    // 验证签名
    if (!verifySign(req.body, merchant.secret_key, sign)) {
      return res.status(400).json({
        status: 'error',
        msg: '签名验证失败',
        code: 400,
        data: {}
      });
    }
    
    // 查找订单
    const order = await GameRechargeOrder.findOne({
      where: {
        order_id,
        platform_order_id,
        api_key
      },
      transaction
    });
    
    if (!order) {
      return res.status(400).json({
        status: 'error',
        msg: '订单不存在',
        code: 400,
        data: {}
      });
    }
    
    // 检查订单状态
    if (order.status !== 0) {
      return res.status(400).json({
        status: 'error',
        msg: '订单状态不允许提交凭证',
        code: 400,
        data: {}
      });
    }
    
    // 更新订单状态和凭证信息
    await order.update({
      callback_str,
      callback_img,
      status: 1,
      submitted_at: new Date()
    }, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: 'success',
      data: []
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('提交订单失败:', error);
    next(error);
  }
};

/**
 * 查询订单接口
 * @route POST /api/game-recharge/queryOrder
 */
exports.queryOrder = async (req, res, next) => {
  try {
    const { order_id, api_key, sign } = req.body;
    
    // 验证必填参数
    if (!order_id || !api_key || !sign) {
      return res.status(400).json({
        status: 'error',
        msg: '缺少必填参数',
        code: 400,
        data: {}
      });
    }
    
    // 验证商户配置
    const merchant = await MerchantConfig.findOne({
      where: { api_key, status: 1 }
    });
    
    if (!merchant) {
      return res.status(400).json({
        status: 'error',
        msg: '无效的API密钥或商户已禁用',
        code: 400,
        data: {}
      });
    }
    
    // 验证签名
    if (!verifySign(req.body, merchant.secret_key, sign)) {
      return res.status(400).json({
        status: 'error',
        msg: '签名验证失败',
        code: 400,
        data: {}
      });
    }
    
    // 查找订单
    const order = await GameRechargeOrder.findOne({
      where: {
        order_id,
        api_key
      },
      include: [
        {
          model: CountryCode,
          as: 'country',
          attributes: ['name', 'currency']
        }
      ]
    });
    
    if (!order) {
      return res.status(400).json({
        status: 'error',
        msg: '订单不存在',
        code: 400,
        data: {}
      });
    }
    
    res.json({
      status: 'success',
      msg: 'success',
      data: {
        order_id: order.order_id,
        platform_order_id: order.platform_order_id,
        amount: parseFloat(order.amount),
        actual_amount: order.actual_amount ? parseFloat(order.actual_amount) : null,
        status: order.status,
        created_at: order.created_at,
        submitted_at: order.submitted_at,
        callback_at: order.callback_at,
        country: order.country ? {
          name: order.country.name,
          currency: order.country.currency
        } : null
      }
    });
    
  } catch (error) {
    console.error('查询订单失败:', error);
    next(error);
  }
};

/**
 * 获取商户配置列表（管理接口）
 * @route GET /api/game-recharge/merchants
 */
exports.getMerchants = async (req, res, next) => {
  try {
    const merchants = await MerchantConfig.findAll({
      attributes: ['id', 'merchant_id', 'api_key', 'status', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      status: 'success',
      data: merchants
    });
    
  } catch (error) {
    console.error('获取商户列表失败:', error);
    next(error);
  }
};

/**
 * 获取国家编号列表
 * @route GET /api/game-recharge/countries
 */
exports.getCountries = async (req, res, next) => {
  try {
    const countries = await CountryCode.findAll({
      where: { status: 1 },
      attributes: ['code', 'name', 'currency'],
      order: [['name', 'ASC']]
    });
    
    res.json({
      status: 'success',
      data: countries
    });
    
  } catch (error) {
    console.error('获取国家列表失败:', error);
    next(error);
  }
};

/**
 * 获取统计数据
 * @route GET /api/game-recharge/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    // 获取总订单数
    const totalOrders = await GameRechargeOrder.count();
    
    // 获取总金额
    const totalAmountResult = await GameRechargeOrder.sum('amount');
    const totalAmount = totalAmountResult || 0;
    
    // 获取成功订单数（状态为2）
    const successOrders = await GameRechargeOrder.count({
      where: { status: 2 }
    });
    
    // 计算成功率
    const successRate = totalOrders > 0 ? (successOrders / totalOrders) * 100 : 0;
    
    res.json({
      status: 'success',
      data: {
        totalOrders,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        successOrders,
        successRate: parseFloat(successRate.toFixed(1))
      }
    });
    
  } catch (error) {
    console.error('获取统计数据失败:', error);
    next(error);
  }
};

/**
 * 获取最近订单
 * @route GET /api/game-recharge/orders/recent
 */
exports.getRecentOrders = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const recentOrders = await GameRechargeOrder.findAll({
      include: [
        {
          model: MerchantConfig,
          as: 'merchant',
          attributes: ['merchant_id'],
          required: false
        },
        {
          model: CountryCode,
          as: 'country',
          attributes: ['name'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: limit
    });
    
    // 状态名称映射
    const statusNames = {
      0: '待提交凭证',
      1: '待审核',
      2: '审核通过',
      3: '审核拒绝',
      4: '订单取消'
    };
    
    const result = recentOrders.map(order => ({
      orderId: order.order_id,
      platformOrderId: order.platform_order_id,
      amount: parseFloat(order.amount),
      status: order.status,
      statusText: statusNames[order.status] || '未知状态',
      merchantId: order.merchant ? order.merchant.merchant_id : order.api_key,
      country: order.code,
      countryName: order.country ? order.country.name : '未知',
      createdAt: order.created_at
    }));
    
    res.json({
      status: 'success',
      data: result
    });
    
  } catch (error) {
    console.error('获取最近订单失败:', error);
    next(error);
  }
};