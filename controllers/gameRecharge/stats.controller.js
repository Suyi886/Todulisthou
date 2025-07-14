const { Op } = require('sequelize');
const { GameRechargeOrder } = require('../../models');
const { sequelize } = require('../../config/db');

/**
 * 获取订单趋势统计
 * @route GET /api/game-recharge/stats/order-trend
 */
exports.getOrderTrend = async (req, res, next) => {
  try {
    const { start_date, end_date, period = 'day' } = req.query;
    
    // 默认查询最近30天
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    let dateFormat;
    let groupBy;
    
    switch (period) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        groupBy = 'HOUR';
        break;
      case 'month':
        dateFormat = '%Y-%m-01';
        groupBy = 'MONTH';
        break;
      case 'year':
        dateFormat = '%Y-01-01';
        groupBy = 'YEAR';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        groupBy = 'DAY';
    }
    
    const query = `
      SELECT 
        DATE_FORMAT(created_at, '${dateFormat}') as date,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
        SUM(amount) as total_amount
      FROM game_recharge_orders 
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY DATE_FORMAT(created_at, '${dateFormat}')
      ORDER BY date ASC
    `;
    
    const [results] = await sequelize.query(query, {
      replacements: [startDate, endDate]
    });
    
    // 生成完整的日期序列
    const dates = [];
    const orders = [];
    const amounts = [];
    
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      let dateStr;
      switch (period) {
        case 'hour':
          dateStr = current.toISOString().substring(0, 13) + ':00:00';
          current.setHours(current.getHours() + 1);
          break;
        case 'month':
          dateStr = current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0') + '-01';
          current.setMonth(current.getMonth() + 1);
          break;
        case 'year':
          dateStr = current.getFullYear() + '-01-01';
          current.setFullYear(current.getFullYear() + 1);
          break;
        default:
          dateStr = current.toISOString().substring(0, 10);
          current.setDate(current.getDate() + 1);
      }
      
      const result = results.find(r => r.date === dateStr);
      dates.push(dateStr);
      orders.push(result ? parseInt(result.order_count) : 0);
      amounts.push(result ? parseFloat(result.completed_amount) || 0 : 0);
    }
    
    // 为ElTable兼容性创建数组格式的data
    const tableData = dates.map((date, index) => ({
      date,
      order_count: orders[index],
      amount: amounts[index]
    }));
    
    res.json({
      status: 'success',
      data: tableData, // ElTable兼容的数组格式
      chartData: { // 图表使用的原始格式
        dates,
        orders,
        amounts
      },
      period,
      start_date: startDate.toISOString().substring(0, 10),
      end_date: endDate.toISOString().substring(0, 10)
    });
    
  } catch (error) {
    console.error('获取订单趋势失败:', error);
    next(error);
  }
};

/**
 * 获取订单状态统计
 * @route GET /api/game-recharge/stats/order-status
 */
exports.getOrderStatus = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    // 默认查询最近30天
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM game_recharge_orders 
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const [results] = await sequelize.query(query, {
      replacements: [startDate, endDate]
    });
    
    // 转换为数组格式以兼容ElTable
    const data = results.map(result => ({
      status: result.status,
      count: parseInt(result.count),
      total_amount: parseFloat(result.total_amount) || 0,
      avg_amount: parseFloat(result.avg_amount) || 0,
      percentage: 0 // 将在下面计算
    }));
    
    // 计算百分比
    const totalOrders = data.reduce((sum, item) => sum + item.count, 0);
    data.forEach(item => {
      item.percentage = totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(2) : 0;
    });
    
    res.json({
      status: 'success',
      data: data,
      total_orders: totalOrders,
      start_date: startDate.toISOString().substring(0, 10),
      end_date: endDate.toISOString().substring(0, 10)
    });
    
  } catch (error) {
    console.error('获取订单状态统计失败:', error);
    next(error);
  }
};

/**
 * 获取商户统计
 * @route GET /api/game-recharge/stats/merchant
 */
exports.getMerchantStats = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    // 默认查询最近30天
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const query = `
      SELECT 
        merchant_id,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
      FROM game_recharge_orders 
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY merchant_id
      ORDER BY completed_amount DESC
    `;
    
    const [results] = await sequelize.query(query, {
      replacements: [startDate, endDate]
    });
    
    // 转换为数组格式以兼容ElTable
    const data = results.map(result => ({
      merchant_id: result.merchant_id,
      order_count: parseInt(result.order_count),
      completed_amount: parseFloat(result.completed_amount) || 0,
      total_amount: parseFloat(result.total_amount) || 0,
      completed_count: parseInt(result.completed_count),
      failed_count: parseInt(result.failed_count),
      success_rate: result.order_count > 0 ? ((result.completed_count / result.order_count) * 100).toFixed(2) : 0
    }));
    
    res.json({
      status: 'success',
      data: data,
      start_date: startDate.toISOString().substring(0, 10),
      end_date: endDate.toISOString().substring(0, 10)
    });
    
  } catch (error) {
    console.error('获取商户统计失败:', error);
    next(error);
  }
};

/**
 * 获取国家统计
 * @route GET /api/game-recharge/stats/country
 */
exports.getCountryStats = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    // 默认查询最近30天
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const query = `
      SELECT 
        code as country_code,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
      FROM game_recharge_orders 
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY code
      ORDER BY completed_amount DESC
    `;
    
    const [results] = await sequelize.query(query, {
      replacements: [startDate, endDate]
    });
    
    // 转换为数组格式以兼容ElTable
    const data = results.map(result => ({
      country_code: result.country_code,
      order_count: parseInt(result.order_count),
      completed_amount: parseFloat(result.completed_amount) || 0,
      total_amount: parseFloat(result.total_amount) || 0,
      completed_count: parseInt(result.completed_count),
      success_rate: result.order_count > 0 ? ((result.completed_count / result.order_count) * 100).toFixed(2) : 0
    }));
    
    res.json({
      status: 'success',
      data: data,
      start_date: startDate.toISOString().substring(0, 10),
      end_date: endDate.toISOString().substring(0, 10)
    });
    
  } catch (error) {
    console.error('获取国家统计失败:', error);
    next(error);
  }
};

/**
 * 获取总体统计概览
 * @route GET /api/game-recharge/stats/overview
 */
exports.getOverview = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    // 默认查询最近30天
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(DISTINCT merchant_id) as active_merchants,
        COUNT(DISTINCT code) as active_countries
      FROM game_recharge_orders 
      WHERE created_at >= ? AND created_at <= ?
    `;
    
    const [results] = await sequelize.query(query, {
      replacements: [startDate, endDate]
    });
    
    const overview = results[0];
    
    // 计算成功率
    const successRate = overview.total_orders > 0 ? 
      ((overview.completed_orders / overview.total_orders) * 100).toFixed(2) : 0;
    
    res.json({
      status: 'success',
      data: {
        total_orders: parseInt(overview.total_orders),
        completed_amount: parseFloat(overview.completed_amount) || 0,
        total_amount: parseFloat(overview.total_amount) || 0,
        completed_orders: parseInt(overview.completed_orders),
        failed_orders: parseInt(overview.failed_orders),
        pending_orders: parseInt(overview.pending_orders),
        active_merchants: parseInt(overview.active_merchants),
        active_countries: parseInt(overview.active_countries),
        success_rate: successRate
      },
      start_date: startDate.toISOString().substring(0, 10),
      end_date: endDate.toISOString().substring(0, 10)
    });
    
  } catch (error) {
    console.error('获取统计概览失败:', error);
    next(error);
  }
};