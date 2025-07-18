const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
// const gameRechargeController = require('../controllers/gameRecharge.controller'); // 已删除，功能分离到各个专门控制器
const merchantController = require('../controllers/gameRecharge/merchant.controller');
const countryController = require('../controllers/gameRecharge/country.controller');
const statsController = require('../controllers/gameRecharge/stats.controller');
const orderController = require('../controllers/gameRecharge/order.controller');
const cashierController = require('../controllers/gameRecharge/cashier.controller');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/game-recharge/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'callback-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * @route POST /api/game-recharge/createOrderMain
 * @desc 创建订单
 * @access Public
 */
router.post('/createOrderMain', orderController.createOrderMain);

/**
 * @route POST /api/game-recharge/submitOrder
 * @desc 提交订单凭证
 * @access Public
 */
router.post('/submitOrder', upload.single('callback_img'), orderController.submitOrderWithFile);

/**
 * @route POST /api/game-recharge/queryOrder
 * @desc 查询订单状态
 * @access Public
 */
router.post('/queryOrder', orderController.queryOrderByPost);

/**
 * @route GET /api/game-recharge/merchants
 * @desc 获取商户配置列表（管理接口）
 * @access Public
 */
router.get('/merchants', merchantController.getMerchants);

/**
 * @route POST /api/game-recharge/merchants
 * @desc 创建商户配置
 * @access Public
 */
router.post('/merchants', merchantController.createMerchant);

/**
 * @route PUT /api/game-recharge/merchants/:id
 * @desc 更新商户配置
 * @access Public
 */
router.put('/merchants/:id', merchantController.updateMerchant);

/**
 * @route DELETE /api/game-recharge/merchants/:id
 * @desc 删除商户配置
 * @access Public
 */
router.delete('/merchants/:id', merchantController.deleteMerchant);

/**
 * @route PUT /api/game-recharge/merchants/:id/status
 * @desc 切换商户状态
 * @access Public
 */
router.put('/merchants/:id/status', merchantController.toggleMerchantStatus);

/**
 * @route PUT /api/game-recharge/merchants/:id/regenerate-key
 * @desc 重新生成商户密钥
 * @access Public
 */
router.put('/merchants/:id/regenerate-key', merchantController.regenerateMerchantKeys);

/**
 * @route PUT /api/game-recharge/merchants/:id/regenerate-api-key
 * @desc 重新生成商户API密钥
 * @access Public
 */
router.put('/merchants/:id/regenerate-api-key', merchantController.regenerateApiKey);

/**
 * @route PUT /api/game-recharge/merchants/:id/regenerate-secret-key
 * @desc 重新生成商户签名密钥
 * @access Public
 */
router.put('/merchants/:id/regenerate-secret-key', merchantController.regenerateSecretKey);

/**
 * @route GET /api/game-recharge/countries
 * @desc 获取国家编号列表
 * @access Public
 */
router.get('/countries', countryController.getCountries);

/**
 * @route POST /api/game-recharge/countries
 * @desc 创建国家配置
 * @access Public
 */
router.post('/countries', countryController.createCountry);

/**
 * @route PUT /api/game-recharge/countries/:id
 * @desc 更新国家配置
 * @access Public
 */
router.put('/countries/:id', countryController.updateCountry);

/**
 * @route DELETE /api/game-recharge/countries/:id
 * @desc 删除国家配置
 * @access Public
 */
router.delete('/countries/:id', countryController.deleteCountry);

/**
 * @route PUT /api/game-recharge/countries/:id/status
 * @desc 切换国家状态
 * @access Public
 */
router.put('/countries/:id/status', countryController.toggleCountryStatus);

/**
 * @route GET /api/game-recharge/countries/:id
 * @desc 获取单个国家详情
 * @access Public
 */
router.get('/countries/:id', countryController.getCountryById);

/**
 * @route GET /api/game-recharge/stats
 * @desc 获取统计数据
 * @access Public
 */
router.get('/stats', statsController.getOverview);

/**
 * @route GET /api/game-recharge/stats/order-trends
 * @desc 获取订单趋势数据
 * @access Public
 */
router.get('/stats/order-trends', statsController.getOrderTrend);

/**
 * @route GET /api/game-recharge/stats/order-trend
 * @desc 获取订单趋势数据（前端兼容路径）
 * @access Public
 */
router.get('/stats/order-trend', statsController.getOrderTrend);

/**
 * @route GET /api/game-recharge/stats/order-status-distribution
 * @desc 获取订单状态分布
 * @access Public
 */
router.get('/stats/order-status-distribution', statsController.getOrderStatus);

/**
 * @route GET /api/game-recharge/stats/order-status
 * @desc 获取订单状态分布（前端兼容路径）
 * @access Public
 */
router.get('/stats/order-status', statsController.getOrderStatus);

/**
 * @route GET /api/game-recharge/stats/country-distribution
 * @desc 获取国家分布数据
 * @access Public
 */
router.get('/stats/country-distribution', statsController.getCountryStats);

/**
 * @route GET /api/game-recharge/stats/merchant-ranking
 * @desc 获取商户排行
 * @access Public
 */
router.get('/stats/merchant-ranking', statsController.getMerchantStats);

/**
 * @route GET /api/game-recharge/stats/overview
 * @desc 获取统计概览
 * @access Public
 */
router.get('/stats/overview', statsController.getOverview);

/**
 * @route GET /api/game-recharge/stats/merchant
 * @desc 获取商户统计
 * @access Public
 */
router.get('/stats/merchant', statsController.getMerchantStats);

/**
 * @route GET /api/game-recharge/stats/country
 * @desc 获取国家统计
 * @access Public
 */
router.get('/stats/country', statsController.getCountryStats);

/**
 * @route GET /api/game-recharge/orders
 * @desc 获取订单列表（分页）
 * @access Public
 */
router.get('/orders', orderController.getOrders);

/**
 * @route GET /api/game-recharge/orders/recent
 * @desc 获取最近订单
 * @access Public
 */
router.get('/orders/recent', orderController.getRecentOrders);

/**
 * @route POST /api/game-recharge/orders
 * @desc 创建充值订单
 * @access Public
 */
router.post('/orders', orderController.createOrder);

/**
 * @route GET /api/game-recharge/orders/:order_id
 * @desc 查询订单状态
 * @access Public
 */
router.get('/orders/:order_id', orderController.getOrderStatus);

/**
 * @route POST /api/game-recharge/orders/:order_id/submit
 * @desc 提交订单进行处理
 * @access Public
 */
router.post('/orders/:order_id/submit', orderController.submitOrder);

/**
 * @route PUT /api/game-recharge/orders/:order_id/status
 * @desc 手动更新订单状态（管理员功能）
 * @access Public
 */
router.put('/orders/:order_id/status', orderController.updateOrderStatus);

/**
 * @route DELETE /api/game-recharge/orders/:order_id
 * @desc 删除订单（管理员功能）
 * @access Public
 */
router.delete('/orders/:order_id', orderController.deleteOrder);

/**
 * @route POST /api/game-recharge/orders/batch
 * @desc 批量处理订单
 * @access Public
 */
router.post('/orders/batch', orderController.batchProcessOrders);

// ==================== 收银台相关路由 ====================

/**
 * @route GET /api/game-recharge/cashier/:platform_order_id
 * @desc 获取收银台页面信息
 * @access Public
 */
router.get('/cashier/:platform_order_id', cashierController.getCashierInfo);

/**
 * @route POST /api/game-recharge/cashier/submit-payment
 * @desc 在收银台提交支付凭证
 * @access Public
 */
router.post('/cashier/submit-payment', upload.single('callback_img'), cashierController.submitPayment);

/**
 * @route GET /api/game-recharge/cashier/status/:platform_order_id
 * @desc 获取订单支付状态
 * @access Public
 */
router.get('/cashier/status/:platform_order_id', cashierController.getPaymentStatus);

/**
 * @route GET /api/game-recharge/cashier/redirect/:platform_order_id
 * @desc 处理支付完成后的页面跳转
 * @access Public
 */
router.get('/cashier/redirect/:platform_order_id', cashierController.handlePaymentRedirect);

module.exports = router;