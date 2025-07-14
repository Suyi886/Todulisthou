const http = require('http');

function testAPI(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/game-recharge${path}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`${path}: ${res.statusCode}`);
        if (res.statusCode !== 200) {
          console.log(`错误: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`${path}: 连接错误 - ${err.message}`);
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log('快速测试API状态...');
  await testAPI('/orders');
  await testAPI('/orders/recent');
  await testAPI('/stats');
  await testAPI('/stats/overview');
  console.log('测试完成');
}

runTests();