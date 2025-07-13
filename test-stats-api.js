const axios = require('axios');

// 配置基础URL
const BASE_URL = 'http://localhost:3000/api/game-recharge';

/**
 * 测试统计接口
 */
async function testStatsAPI() {
  console.log('开始测试游戏充值平台统计接口...');
  
  try {
    // 1. 测试获取统计数据
    console.log('\n1. 测试获取统计数据');
    const statsResponse = await axios.get(`${BASE_URL}/stats`);
    console.log('统计数据:', JSON.stringify(statsResponse.data, null, 2));
    
    // 2. 测试获取订单趋势数据
    console.log('\n2. 测试获取订单趋势数据（最近7天）');
    const trendsResponse = await axios.get(`${BASE_URL}/stats/order-trends?days=7`);
    console.log('订单趋势:', JSON.stringify(trendsResponse.data, null, 2));
    
    // 3. 测试获取订单状态分布
    console.log('\n3. 测试获取订单状态分布');
    const statusResponse = await axios.get(`${BASE_URL}/stats/order-status-distribution`);
    console.log('状态分布:', JSON.stringify(statusResponse.data, null, 2));
    
    // 4. 测试获取国家分布数据
    console.log('\n4. 测试获取国家分布数据');
    const countryResponse = await axios.get(`${BASE_URL}/stats/country-distribution`);
    console.log('国家分布:', JSON.stringify(countryResponse.data, null, 2));
    
    // 5. 测试获取商户排行
    console.log('\n5. 测试获取商户排行（前5名）');
    const merchantResponse = await axios.get(`${BASE_URL}/stats/merchant-ranking?limit=5`);
    console.log('商户排行:', JSON.stringify(merchantResponse.data, null, 2));
    
    // 6. 测试获取最近订单
    console.log('\n6. 测试获取最近订单（最近5条）');
    const recentResponse = await axios.get(`${BASE_URL}/orders/recent?limit=5`);
    console.log('最近订单:', JSON.stringify(recentResponse.data, null, 2));
    
    console.log('\n✅ 所有统计接口测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    console.error('完整错误:', error);
  }
}

/**
 * 测试基础接口（确保服务正常）
 */
async function testBasicAPI() {
  console.log('\n测试基础接口...');
  
  try {
    // 测试获取国家列表
    const countriesResponse = await axios.get(`${BASE_URL}/countries`);
    console.log('国家列表:', JSON.stringify(countriesResponse.data, null, 2));
    
    // 测试获取商户列表
    const merchantsResponse = await axios.get(`${BASE_URL}/merchants`);
    console.log('商户列表:', JSON.stringify(merchantsResponse.data, null, 2));
    
  } catch (error) {
    console.error('基础接口测试失败:');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('游戏充值平台统计接口测试');
  console.log('='.repeat(60));
  
  // 先测试基础接口
  await testBasicAPI();
  
  // 再测试统计接口
  await testStatsAPI();
  
  console.log('\n测试完成！');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testStatsAPI,
  testBasicAPI
};