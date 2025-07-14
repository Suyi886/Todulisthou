const axios = require('axios');

async function testCountryAPI() {
  try {
    console.log('测试国家API...');
    const response = await axios.get('http://localhost:3000/api/game-recharge/countries?page=1&limit=5');
    console.log('✅ 成功!');
    console.log('状态:', response.data.status);
    console.log('数据长度:', response.data.data.length);
  } catch (error) {
    console.error('❌ 失败:');
    console.error('错误:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应:', error.response.data);
    }
  }
}

testCountryAPI();