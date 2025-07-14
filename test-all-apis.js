const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/game-recharge';

async function testAllAPIs() {
  console.log('=== 测试所有游戏充值API接口 ===\n');
  
  const tests = [
    {
      name: '订单列表API',
      url: `${BASE_URL}/orders?page=1&limit=10`
    },
    {
      name: '统计API',
      url: `${BASE_URL}/stats?start_date=2025-01-01&end_date=2025-12-31`
    },
    {
      name: '最近订单API',
      url: `${BASE_URL}/orders/recent?limit=5`
    },
    {
      name: '概览统计API',
      url: `${BASE_URL}/stats/overview`
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`测试 ${test.name}...`);
      const response = await axios.get(test.url, { timeout: 5000 });
      console.log(`✅ ${test.name} 正常 (状态码: ${response.status})`);
      console.log(`响应数据:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log(`❌ ${test.name} 错误:`);
      if (error.response) {
        console.log(`状态码: ${error.response.status}`);
        console.log(`错误信息:`, error.response.data);
      } else {
        console.log(`错误:`, error.message);
      }
    }
    console.log('\n' + '-'.repeat(50) + '\n');
  }
  
  console.log('测试完成！');
}

testAllAPIs();