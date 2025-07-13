const axios = require('axios');
const crypto = require('crypto');

// 配置
const BASE_URL = 'http://localhost:3001/api/game-recharge';
const API_KEY = 'api_key_001';
const SECRET_KEY = 'secret_key_001';

// 生成签名
function generateSign(params, secretKey) {
  const sortedParams = Object.keys(params)
    .filter(key => key !== 'sign' && params[key] !== undefined && params[key] !== '')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const signString = `${sortedParams}&key=${secretKey}`;
  return crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
}

// 测试创建订单
async function testCreateOrder() {
  console.log('\n=== 测试创建订单 ===');
  
  const params = {
    order_id: `TEST_${Date.now()}`,
    amount: 100.50,
    code: 'CN',
    api_key: API_KEY,
    syn_callback_url: 'https://example.com/success',
    notify_url: 'https://example.com/notify'
  };
  
  params.sign = generateSign(params, SECRET_KEY);
  
  try {
    const response = await axios.post(`${BASE_URL}/createOrderMain`, params);
    console.log('创建订单成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('创建订单失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试提交订单
async function testSubmitOrder(orderData) {
  if (!orderData) return;
  
  console.log('\n=== 测试提交订单 ===');
  
  const params = {
    order_id: orderData.order_id || `TEST_${Date.now()}`,
    platform_order_id: orderData.platform_order_id,
    callback_str: 'payment_transaction_12345',
    api_key: API_KEY
  };
  
  params.sign = generateSign(params, SECRET_KEY);
  
  try {
    const response = await axios.post(`${BASE_URL}/submitOrder`, params);
    console.log('提交订单成功:', response.data);
  } catch (error) {
    console.error('提交订单失败:', error.response?.data || error.message);
  }
}

// 测试查询订单
async function testQueryOrder(orderId) {
  if (!orderId) return;
  
  console.log('\n=== 测试查询订单 ===');
  
  const params = {
    order_id: orderId,
    api_key: API_KEY
  };
  
  params.sign = generateSign(params, SECRET_KEY);
  
  try {
    const response = await axios.post(`${BASE_URL}/queryOrder`, params);
    console.log('查询订单成功:', response.data);
  } catch (error) {
    console.error('查询订单失败:', error.response?.data || error.message);
  }
}

// 测试获取国家列表
async function testGetCountries() {
  console.log('\n=== 测试获取国家列表 ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/countries`);
    console.log('获取国家列表成功:', response.data);
  } catch (error) {
    console.error('获取国家列表失败:', error.response?.data || error.message);
  }
}

// 测试获取商户列表
async function testGetMerchants() {
  console.log('\n=== 测试获取商户列表 ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/merchants`);
    console.log('获取商户列表成功:', response.data);
  } catch (error) {
    console.error('获取商户列表失败:', error.response?.data || error.message);
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试游戏充值API接口...');
  
  // 测试获取基础数据
  await testGetCountries();
  await testGetMerchants();
  
  // 测试订单流程
  const orderData = await testCreateOrder();
  if (orderData) {
    await testSubmitOrder({
      order_id: orderData.order_id || `TEST_${Date.now()}`,
      platform_order_id: orderData.platform_order_id
    });
    await testQueryOrder(orderData.order_id || `TEST_${Date.now()}`);
  }
  
  console.log('\n测试完成!');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testCreateOrder,
  testSubmitOrder,
  testQueryOrder,
  testGetCountries,
  testGetMerchants
};