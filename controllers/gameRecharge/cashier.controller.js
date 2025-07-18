const { Op } = require('sequelize');
const { GameRechargeOrder, MerchantConfig, CountryCode } = require('../../models');
const { sequelize } = require('../../config/db');
const crypto = require('crypto');

/**
 * 获取收银台页面信息
 * @route GET /api/game-recharge/cashier/:platform_order_id
 * @desc 根据平台订单号获取收银台页面所需的订单信息
 * @access Public
 */
exports.getCashierInfo = async (req, res, next) => {
  try {
    const { platform_order_id } = req.params;
    
    if (!platform_order_id) {
      return res.status(400).json({
        status: 'error',
        msg: '缺少平台订单号',
        code: 400,
        data: {}
      });
    }
    
    // 查找订单信息
    const order = await GameRechargeOrder.findOne({
      where: {
        platform_order_id,
        status: { [Op.in]: [0, 1] } // 只允许待付款和已提交凭证状态的订单
      }
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        msg: '订单不存在或状态不允许支付',
        code: 404,
        data: {}
      });
    }
    
    // 获取国家信息
    const country = await CountryCode.findOne({
      where: {
        code: order.code,
        status: 1
      }
    });
    
    if (!country) {
      return res.status(400).json({
        status: 'error',
        msg: '国家信息不存在',
        code: 400,
        data: {}
      });
    }
    
    // 获取商户信息（用于显示商户名称等）
    const merchant = await MerchantConfig.findOne({
      where: {
        api_key: order.api_key,
        status: 1
      }
    });
    
    if (!merchant) {
      return res.status(400).json({
        status: 'error',
        msg: '商户信息不存在',
        code: 400,
        data: {}
      });
    }
    
    // 返回收银台所需信息
    res.json({
      status: 'success',
      msg: '获取收银台信息成功',
      data: {
        platform_order_id: order.platform_order_id,
        order_id: order.order_id,
        amount: parseFloat(order.amount),
        currency: country.currency || 'USD',
        country_name: country.name,
        country_code: order.code,
        merchant_name: merchant.merchant_name,
        status: order.status,
        status_text: getStatusText(order.status),
        created_at: order.created_at,
        payment_methods: country.payment_methods ? JSON.parse(country.payment_methods) : [],
        qr_code_url: country.qr_code_url,
        bank_info: country.bank_info ? JSON.parse(country.bank_info) : null
      }
    });
    
  } catch (error) {
    console.error('获取收银台信息失败:', error);
    next(error);
  }
};

/**
 * 提交支付凭证（收银台版本）
 * @route POST /api/game-recharge/cashier/submit-payment
 * @desc 在收银台页面提交支付凭证
 * @access Public
 */
exports.submitPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { platform_order_id, payment_method, callback_str, actual_amount } = req.body;
    const callback_img = req.file;
    
    // 验证必填参数
    if (!platform_order_id) {
      return res.status(400).json({
        status: 'error',
        msg: '缺少平台订单号',
        code: 400,
        data: {}
      });
    }
    
    if (!callback_str && !callback_img) {
      return res.status(400).json({
        status: 'error',
        msg: '请提供支付凭证（文字说明或图片）',
        code: 400,
        data: {}
      });
    }
    
    // 查找订单
    const order = await GameRechargeOrder.findOne({
      where: {
        platform_order_id,
        status: 0 // 只允许待付款状态的订单提交凭证
      },
      transaction
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        msg: '订单不存在或状态不允许提交凭证',
        code: 404,
        data: {}
      });
    }
    
    // 准备更新数据
    const updateData = {
      status: 1, // 已提交凭证
      submitted_at: new Date()
    };
    
    if (callback_str) {
      updateData.callback_str = callback_str;
    }
    
    if (callback_img) {
      updateData.callback_img = callback_img.path;
    }
    
    if (actual_amount && parseFloat(actual_amount) > 0) {
      updateData.actual_amount = parseFloat(actual_amount);
    }
    
    // 更新订单状态
    await order.update(updateData, { transaction });
    
    await transaction.commit();
    
    res.json({
      status: 'success',
      msg: '支付凭证提交成功，请等待审核',
      data: {
        platform_order_id: order.platform_order_id,
        status: 1,
        status_text: '已提交凭证，待审核',
        submitted_at: updateData.submitted_at
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('提交支付凭证失败:', error);
    next(error);
  }
};

/**
 * 获取订单支付状态
 * @route GET /api/game-recharge/cashier/status/:platform_order_id
 * @desc 获取订单的实时支付状态
 * @access Public
 */
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { platform_order_id } = req.params;
    
    if (!platform_order_id) {
      return res.status(400).json({
        status: 'error',
        msg: '缺少平台订单号',
        code: 400,
        data: {}
      });
    }
    
    const order = await GameRechargeOrder.findOne({
      where: {
        platform_order_id
      }
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        msg: '订单不存在',
        code: 404,
        data: {}
      });
    }
    
    res.json({
      status: 'success',
      msg: '获取订单状态成功',
      data: {
        platform_order_id: order.platform_order_id,
        order_id: order.order_id,
        status: order.status,
        status_text: getStatusText(order.status),
        amount: parseFloat(order.amount),
        actual_amount: order.actual_amount ? parseFloat(order.actual_amount) : null,
        created_at: order.created_at,
        submitted_at: order.submitted_at,
        updated_at: order.updated_at,
        error_msg: order.error_msg
      }
    });
    
  } catch (error) {
    console.error('获取订单状态失败:', error);
    next(error);
  }
};

/**
 * 处理支付成功后的跳转
 * @route GET /api/game-recharge/cashier/redirect/:platform_order_id
 * @desc 处理支付完成后的页面跳转
 * @access Public
 */
exports.handlePaymentRedirect = async (req, res, next) => {
  try {
    const { platform_order_id } = req.params;
    
    if (!platform_order_id) {
      return res.status(400).json({
        status: 'error',
        msg: '缺少平台订单号',
        code: 400,
        data: {}
      });
    }
    
    const order = await GameRechargeOrder.findOne({
      where: {
        platform_order_id
      }
    });
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        msg: '订单不存在',
        code: 404,
        data: {}
      });
    }
    
    // 如果有同步回调地址，重定向到商户指定的地址
    if (order.syn_callback_url) {
      const redirectUrl = new URL(order.syn_callback_url);
      redirectUrl.searchParams.append('platform_order_id', order.platform_order_id);
      redirectUrl.searchParams.append('order_id', order.order_id);
      redirectUrl.searchParams.append('status', order.status);
      redirectUrl.searchParams.append('amount', order.amount);
      
      return res.redirect(redirectUrl.toString());
    }
    
    // 如果没有同步回调地址，返回订单信息
    res.json({
      status: 'success',
      msg: '支付处理完成',
      data: {
        platform_order_id: order.platform_order_id,
        order_id: order.order_id,
        status: order.status,
        status_text: getStatusText(order.status),
        amount: parseFloat(order.amount)
      }
    });
    
  } catch (error) {
    console.error('处理支付跳转失败:', error);
    next(error);
  }
};

/**
 * 获取状态文本描述
 * @param {number} status 状态码
 * @returns {string} 状态描述
 */
function getStatusText(status) {
  const statusMap = {
    0: '待付款',
    1: '已提交凭证，待审核',
    2: '审核通过，充值成功',
    10: '充值成功',
    20: '失败(未收到资金)',
    40: '失败(资金冻结)',
    50: '失败(资金返回)'
  };
  
  return statusMap[status] || '未知状态';
}

module.exports = exports;