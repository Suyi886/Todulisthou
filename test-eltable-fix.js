const http = require('http');

/**
 * 测试ElTable数据格式修复
 * 验证API返回的data字段是否为数组类型
 */
async function testElTableFix() {
  console.log('=== 测试ElTable数据格式修复 ===\n');
  
  const testCases = [
    {
      name: '订单列表API',
      url: '/api/game-recharge/orders?page=1&limit=5',
      expectArrayData: true
    },
    {
      name: '订单趋势API',
      url: '/api/game-recharge/stats/order-trend?days=7',
      expectArrayData: true
    },
    {
      name: '订单状态分布API',
      url: '/api/game-recharge/stats/order-status',
      expectArrayData: true
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n测试: ${testCase.name}`);
    console.log(`URL: ${testCase.url}`);
    
    try {
      const result = await makeRequest(testCase.url);
      
      if (result.statusCode === 200) {
        const response = JSON.parse(result.data);
        
        console.log('✅ API响应成功');
        console.log(`- status: ${response.status}`);
        console.log(`- data类型: ${Array.isArray(response.data) ? 'Array ✅' : typeof response.data + ' ❌'}`);
        
        if (testCase.expectArrayData) {
          if (Array.isArray(response.data)) {
            console.log(`- data长度: ${response.data.length}`);
            console.log('🎉 ElTable兼容性: 通过');
          } else {
            console.log('❌ ElTable兼容性: 失败 - data不是数组');
          }
        }
        
        // 检查分页信息是否在顶层
        if (response.page !== undefined) {
          console.log(`- 分页信息: page=${response.page}, limit=${response.limit}, total=${response.total}`);
        }
        
      } else {
        console.log(`❌ API请求失败: ${result.statusCode}`);
      }
      
    } catch (error) {
      console.log(`❌ 请求错误: ${error.message}`);
    }
  }
  
  console.log('\n=== 测试完成 ===');
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// 运行测试
testElTableFix().catch(console.error);