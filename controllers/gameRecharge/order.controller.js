const { Op } = require('sequelize');
const { GameRechargeOrder, MerchantConfig, CountryCode } = require('../../models');
const { sequelize } = require('../../config/db');
const crypto = require('crypto');

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
      merchant_id,
      game_id,
      server_id,
      role_id,
      role_name,
      product_id,
      product_name,
      amount: parseFloat(amount),
      currency,
      code,
      status: 'pending',
      callback_url,
      extra_data: extra_data ? JSON.stringify(extra_data) : null
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
    
    if (order.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        msg: '订单状态不允许提交',
        code: 400
      });
    }
    
    // 更新订单状态为处理中
    await order.update({
      status: 'processing',
      payment_method,
      payment_data: payment_data ? JSON.stringify(payment_data) : null,
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
          status: success ? 'completed' : 'failed',
          completed_at: success ? new Date() : null,
          failure_reason: success ? null : '支付失败'
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
        status: 'processing'
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
        'order_id', 'merchant_id', 'game_id', 'server_id', 'role_id', 'role_name',
        'product_id', 'product_name', 'amount', 'currency', 'code', 'status',
        'created_at', 'submitted_at', 'completed_at', 'failure_reason'
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
    
    if (req.query.merchant_id) {
      whereClause.merchant_id = req.query.merchant_id;
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
    
    if (req.query.game_id) {
      whereClause.game_id = req.query.game_id;
    }
    
    if (req.query.start_date && req.query.end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(req.query.start_date), new Date(req.query.end_date)]
      };
    }
    
    const { count, rows } = await GameRechargeOrder.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'order_id', 'merchant_id', 'game_id', 'server_id', 'role_id', 'role_name',
        'product_id', 'product_name', 'amount', 'currency', 'code', 'status',
        'created_at', 'submitted_at', 'completed_at', 'failure_reason'
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
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
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
    const updateData = { status };
    
    if (status === 'completed') {
      updateData.completed_at = new Date();
      updateData.failure_reason = null;
    } else if (status === 'failed') {
      updateData.failure_reason = failure_reason || '管理员手动设置为失败';
      updateData.completed_at = null;
    } else if (status === 'cancelled') {
      updateData.failure_reason = failure_reason || '订单已取消';
      updateData.completed_at = null;
    }
    
    await order.update(updateData, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '订单状态更新成功',
      data: {
        order_id: order.order_id,
        status: status
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
    
    // 只允许删除失败或取消的订单
    if (!['failed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        msg: '只能删除失败或已取消的订单',
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
          
          const updateData = { status };
          if (status === 'completed') {
            updateData.completed_at = new Date();
            updateData.failure_reason = null;
          } else if (status === 'failed') {
            updateData.failure_reason = failure_reason || '批量设置为失败';
            updateData.completed_at = null;
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