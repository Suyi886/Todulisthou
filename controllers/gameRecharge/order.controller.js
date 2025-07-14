const { Op } = require('sequelize');
const { GameRechargeOrder, MerchantConfig, CountryCode } = require('../../models');
const { sequelize } = require('../../config/db');
const crypto = require('crypto');
const path = require('path');

/**
 * 创建充值订单
 * @route POST /api/game-recharge/orders
 */
exports.createOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      merchant_id,
      game_id,
      server_id,
      role_id,
      role_name,
      product_id,
      product_name,
      amount,
      currency,
      code,
      callback_url,
      extra_data
    } = req.body;
    
    // 验证必填参数
    if (!merchant_id || !game_id || !product_id || !amount || !currency || !code) {
      return res.status(400).json({
        status: 'error',
        msg: '缺少必填参数',
        code: 400
      });
    }
    
    // 验证商户配置
    const merchant = await MerchantConfig.findOne({
      where: {
        merchant_id,
        status: 1
      },
      transaction
    });
    
    if (!merchant) {
      return res.status(400).json({
        status: 'error',
        msg: '商户不存在或已禁用',
        code: 400
      });
    }
    
    // 验证国家编号
    const country = await CountryCode.findOne({
      where: {
        code,
        status: 1
      },
      transaction
    });
    
    if (!country) {
      return res.status(400).json({
        status: 'error',
        msg: '国家编号不存在或已禁用',
        code: 400
      });
    }
    
    // 生成订单号
    const order_id = 'GR' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // 创建订单
    const order = await GameRechargeOrder.create({
      order_id,
      platform_order_id: order_id, // 使用订单ID作为平台订单ID
      amount: parseFloat(amount),
      code,
      api_key: merchant.api_key,
      sign: 'auto_generated', // 自动生成的订单不需要验证签名
      status: 0, // 0-待付款
      notify_url: callback_url
    }, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '订单创建成功',
      data: {
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        status: order.status
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('创建订单失败:', error);
    next(error);
  }
};

/**
 * 提交订单进行处理
 * @route POST /api/game-recharge/orders/:order_id/submit
 */
exports.submitOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { order_id } = req.params;
    const { payment_method, payment_data } = req.body;
    
    // 查找订单
    const order = await GameRechargeOrder.findOne({
      where: { order_id },
      transaction
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        msg: '订单不存在',
        code: 404
      });
    }
    
    if (order.status !== 0) {
      return res.status(400).json({
        status: 'error',
        msg: '订单状态不允许提交',
        code: 400
      });
    }
    
    // 更新订单状态为已提交凭证
    await order.update({
      status: 1, // 1-已提交凭证
      callback_str: payment_data ? JSON.stringify(payment_data) : null,
      submitted_at: new Date()
    }, { transaction });
    
    await transaction.commit();
    
    // 这里可以添加实际的支付处理逻辑
    // 模拟异步处理
    setTimeout(async () => {
      try {
        // 模拟支付结果（实际应用中这里会调用第三方支付接口）
        const success = Math.random() > 0.3; // 70%成功率
        
        await order.update({
          status: success ? 2 : 20, // 2-成功，20-失败
          callback_at: success ? new Date() : null,
          error_msg: success ? null : '支付失败'
        });
        
        // 如果有回调URL，发送回调通知
        if (order.callback_url && success) {
          // 这里可以添加回调通知逻辑
          console.log(`发送回调通知到: ${order.callback_url}`);
        }
        
      } catch (error) {
        console.error('处理订单失败:', error);
      }
    }, 2000);
    
    res.json({
      status: 'success',
      msg: '订单提交成功，正在处理中',
      data: {
        order_id: order.order_id,
        status: 1
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('提交订单失败:', error);
    next(error);
  }
};

/**
 * 查询订单状态
 * @route GET /api/game-recharge/orders/:order_id
 */
exports.getOrderStatus = async (req, res, next) => {
  try {
    const { order_id } = req.params;
    
    const order = await GameRechargeOrder.findOne({
      where: { order_id },
      attributes: [
        'order_id', 'platform_order_id', 'amount', 'actual_amount', 'code', 'api_key',
        'syn_callback_url', 'notify_url', 'pay_url', 'callback_str', 'callback_img',
        'status', 'error_msg', 'submitted_at', 'callback_at', 'created_at', 'updated_at'
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        msg: '订单不存在',
        code: 404
      });
    }
    
    res.json({
      status: 'success',
      data: order
    });
    
  } catch (error) {
    console.error('查询订单状态失败:', error);
    next(error);
  }
};

/**
 * 获取订单列表
 * @route GET /api/game-recharge/orders
 */
exports.getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const whereClause = {};
    
    if (req.query.api_key) {
      whereClause.api_key = req.query.api_key;
    }
    
    if (req.query.status) {
      whereClause.status = req.query.status;
    }
    
    if (req.query.code) {
      whereClause.code = req.query.code;
    }
    
    if (req.query.order_id) {
      whereClause.order_id = {
        [Op.like]: `%${req.query.order_id}%`
      };
    }
    
    if (req.query.platform_order_id) {
      whereClause.platform_order_id = {
        [Op.like]: `%${req.query.platform_order_id}%`
      };
    }
    
    if (req.query.start_date && req.query.end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(req.query.start_date), new Date(req.query.end_date)]
      };
    }
    
    const { count, rows } = await GameRechargeOrder.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'order_id', 'platform_order_id', 'amount', 'actual_amount', 'code', 'api_key',
        'syn_callback_url', 'notify_url', 'pay_url', 'callback_str', 'callback_img',
        'status', 'error_msg', 'submitted_at', 'callback_at', 'created_at', 'updated_at'
      ],
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
    console.error('获取订单列表失败:', error);
    next(error);
  }
};

/**
 * 手动更新订单状态（管理员功能）
 * @route PUT /api/game-recharge/orders/:order_id/status
 */
exports.updateOrderStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { order_id } = req.params;
    const { status, failure_reason } = req.body;
    
    // 验证状态值
    const validStatuses = [0, 1, 2, 20, 40, 50]; // 0-待付款，1-已提交凭证，2-成功，20-失败，40-资金冻结，50-资金返回
    const statusNum = parseInt(status);
    if (!validStatuses.includes(statusNum)) {
      return res.status(400).json({
        status: 'error',
        msg: '无效的订单状态',
        code: 400
      });
    }
    
    // 查找订单
    const order = await GameRechargeOrder.findOne({
      where: { order_id },
      transaction
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        msg: '订单不存在',
        code: 404
      });
    }
    
    // 更新订单状态
    const updateData = { status: statusNum };
    
    if (statusNum === 2) { // 成功
      updateData.callback_at = new Date();
      updateData.error_msg = null;
    } else if ([20, 40, 50].includes(statusNum)) { // 各种失败状态
      updateData.error_msg = failure_reason || '管理员手动设置为失败';
      updateData.callback_at = null;
    }
    
    await order.update(updateData, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '订单状态更新成功',
      data: {
        order_id: order.order_id,
        status: statusNum
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('更新订单状态失败:', error);
    next(error);
  }
};

/**
 * 删除订单（管理员功能）
 * @route DELETE /api/game-recharge/orders/:order_id
 */
exports.deleteOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { order_id } = req.params;
    
    // 查找订单
    const order = await GameRechargeOrder.findOne({
      where: { order_id },
      transaction
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        msg: '订单不存在',
        code: 404
      });
    }
    
    // 只允许删除失败的订单
    if (![20, 40, 50].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        msg: '只能删除失败的订单',
        code: 400
      });
    }
    
    // 删除订单
    await order.destroy({ transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '订单删除成功'
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('删除订单失败:', error);
    next(error);
  }
};

/**
 * 批量处理订单
 * @route POST /api/game-recharge/orders/batch
 */
exports.batchProcessOrders = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { order_ids, action, status, failure_reason } = req.body;
    
    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        msg: '请提供有效的订单ID列表',
        code: 400
      });
    }
    
    if (!action || !['update_status', 'delete'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        msg: '无效的操作类型',
        code: 400
      });
    }
    
    const orders = await GameRechargeOrder.findAll({
      where: {
        order_id: {
          [Op.in]: order_ids
        }
      },
      transaction
    });
    
    if (orders.length === 0) {
      return res.status(404).json({
        status: 'error',
        msg: '未找到指定的订单',
        code: 404
      });
    }
    
    let successCount = 0;
    let failureCount = 0;
    const results = [];
    
    for (const order of orders) {
      try {
        if (action === 'update_status') {
          if (!status) {
            throw new Error('缺少状态参数');
          }
          
          const statusNum = parseInt(status);
          const updateData = { status: statusNum };
          if (statusNum === 2) {
            updateData.callback_at = new Date();
          updateData.error_msg = null;
          } else if (statusNum === 20) {
            updateData.error_msg = failure_reason || '批量设置为失败';
          updateData.callback_at = null;
          }
          
          await order.update(updateData, { transaction });
          
        } else if (action === 'delete') {
          if (!['failed', 'cancelled'].includes(order.status)) {
            throw new Error('只能删除失败或已取消的订单');
          }
          
          await order.destroy({ transaction });
        }
        
        successCount++;
        results.push({
          order_id: order.order_id,
          success: true
        });
        
      } catch (error) {
        failureCount++;
        results.push({
          order_id: order.order_id,
          success: false,
          error: error.message
        });
      }
    }
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: `批量操作完成，成功: ${successCount}，失败: ${failureCount}`,
      data: {
        success_count: successCount,
        failure_count: failureCount,
        results: results
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('批量处理订单失败:', error);
    next(error);
  }
};

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
 * 创建订单接口（兼容原API）
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
 * 提交订单接口（兼容原API）
 * @route POST /api/game-recharge/submitOrder
 */
exports.submitOrderWithFile = async (req, res, next) => {
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
 * 查询订单接口（兼容原API）
 * @route POST /api/game-recharge/queryOrder
 */
exports.queryOrderByPost = async (req, res, next) => {
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
      20: '审核拒绝',
      40: '资金冻结',
      50: '资金返回'
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