const http = require('http');

/**
 * 简单的HTTP测试，不依赖axios
 */
function testEndpoint(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`\n测试 ${path}:`);
      console.log(`状态码: ${res.statusCode}`);
      try {
        const jsonData = JSON.parse(data);
        console.log('响应数据:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('响应数据:', data);
      }
      callback();
    });
  });

  req.on('error', (err) => {
    console.error(`\n测试 ${path} 失败:`, err.message);
    callback();
  });

  req.end();
}

/**
 * 测试所有端点
 */
async function testAllEndpoints() {
  console.log('开始测试游戏充值平台接口...');
  
  const endpoints = [
    '/api/game-recharge/countries',
    '/api/game-recharge/merchants',
    '/api/game-recharge/stats',
    '/api/game-recharge/stats/order-trends',
    '/api/game-recharge/stats/order-status-distribution',
    '/api/game-recharge/stats/country-distribution',
    '/api/game-recharge/stats/merchant-ranking',
    '/api/game-recharge/orders/recent'
  ];
  
  for (let i = 0; i < endpoints.length; i++) {
    await new Promise((resolve) => {
      testEndpoint(endpoints[i], resolve);
    });
    // 等待一下再测试下一个
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n所有测试完成！');
}

// 运行测试
if (require.main === module) {
  testAllEndpoints().catch(console.error);
}

module.exports = { testAllEndpoints };