const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/game-recharge';

async function testAPI() {
  console.log('测试API连接...');
  
  try {
    // 测试概览统计API
    console.log('\n测试概览统计API...');
    const response = await axios.get(`${BASE_URL}/stats/overview`, {
      timeout: 5000
    });
    console.log('✅ API正常响应');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ API错误:');
    if (error.code === 'ECONNREFUSED') {
      console.log('连接被拒绝 - 服务器可能未启动');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('请求超时');
    } else {
      console.log('错误代码:', error.code);
      console.log('错误信息:', error.message);
      if (error.response) {
        console.log('状态码:', error.response.status);
        console.log('响应数据:', error.response.data);
      }
    }
  }
}

testAPI();