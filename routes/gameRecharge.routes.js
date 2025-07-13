const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const gameRechargeController = require('../controllers/gameRecharge.controller');

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
router.post('/createOrderMain', gameRechargeController.createOrderMain);

/**
 * @route POST /api/game-recharge/submitOrder
 * @desc 提交订单凭证
 * @access Public
 */
router.post('/submitOrder', upload.single('callback_img'), gameRechargeController.submitOrder);

/**
 * @route POST /api/game-recharge/queryOrder
 * @desc 查询订单状态
 * @access Public
 */
router.post('/queryOrder', gameRechargeController.queryOrder);

/**
 * @route GET /api/game-recharge/merchants
 * @desc 获取商户配置列表（管理接口）
 * @access Public
 */
router.get('/merchants', gameRechargeController.getMerchants);

/**
 * @route GET /api/game-recharge/countries
 * @desc 获取国家编号列表
 * @access Public
 */
router.get('/countries', gameRechargeController.getCountries);

/**
 * @route GET /api/game-recharge/stats
 * @desc 获取统计数据
 * @access Public
 */
router.get('/stats', gameRechargeController.getStats);

/**
 * @route GET /api/game-recharge/stats/order-trends
 * @desc 获取订单趋势数据
 * @access Public
 */
router.get('/stats/order-trends', gameRechargeController.getOrderTrends);

/**
 * @route GET /api/game-recharge/stats/order-trend
 * @desc 获取订单趋势数据（前端兼容路径）
 * @access Public
 */
router.get('/stats/order-trend', gameRechargeController.getOrderTrends);

/**
 * @route GET /api/game-recharge/stats/order-status-distribution
 * @desc 获取订单状态分布
 * @access Public
 */
router.get('/stats/order-status-distribution', gameRechargeController.getOrderStatusDistribution);

/**
 * @route GET /api/game-recharge/stats/order-status
 * @desc 获取订单状态分布（前端兼容路径）
 * @access Public
 */
router.get('/stats/order-status', gameRechargeController.getOrderStatusDistribution);

/**
 * @route GET /api/game-recharge/stats/country-distribution
 * @desc 获取国家分布数据
 * @access Public
 */
router.get('/stats/country-distribution', gameRechargeController.getCountryDistribution);

/**
 * @route GET /api/game-recharge/stats/merchant-ranking
 * @desc 获取商户排行
 * @access Public
 */
router.get('/stats/merchant-ranking', gameRechargeController.getMerchantRanking);

/**
 * @route GET /api/game-recharge/orders
 * @desc 获取订单列表（分页）
 * @access Public
 */
router.get('/orders', gameRechargeController.getOrders);

/**
 * @route GET /api/game-recharge/orders/recent
 * @desc 获取最近订单
 * @access Public
 */
router.get('/orders/recent', gameRechargeController.getRecentOrders);

module.exports = router;