const http = require('http');

// 测试配置
const BASE_URL = 'http://localhost:3000/api/game-recharge';

// 测试用例
const testCases = [
  {
    name: '订单列表（分页）',
    path: '/orders?page=1&limit=20&sort_by=created_at&sort_order=desc'
  },
  {
    name: '订单趋势（前端兼容路径）',
    path: '/stats/order-trend?start_date=2025-07-07&end_date=2025-07-14&type=day'
  },
  {
    name: '订单状态分布（前端兼容路径）',
    path: '/stats/order-status?start_date=2025-07-07&end_date=2025-07-14'
  },
  {
    name: '基础统计数据',
    path: '/stats'
  },
  {
    name: '国家分布',
    path: '/stats/country-distribution'
  },
  {
    name: '商户排行',
    path: '/stats/merchant-ranking?limit=5'
  },
  {
    name: '最近订单',
    path: '/orders/recent?limit=10'
  },
  {
    name: '商户列表',
    path: '/merchants'
  },
  {
    name: '国家列表',
    path: '/countries'
  }
];

// 执行HTTP请求的函数
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// 主测试函数
async function runTests() {
  console.log('开始测试前端API接口兼容性...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`测试 ${testCase.name}:`);
      const url = `${BASE_URL}${testCase.path}`;
      console.log(`请求: ${url}`);
      
      const result = await makeRequest(url);
      
      if (result.statusCode === 200) {
        console.log(`✅ 状态码: ${result.statusCode}`);
        if (result.data && result.data.status === 'success') {
          console.log('✅ 响应格式正确');
          passedTests++;
        } else {
          console.log('❌ 响应格式错误:', result.data);
          failedTests++;
        }
      } else {
        console.log(`❌ 状态码: ${result.statusCode}`);
        console.log('响应:', result.data);
        failedTests++;
      }
      
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`);
      failedTests++;
    }
    
    console.log(''); // 空行分隔
  }
  
  console.log('='.repeat(50));
  console.log(`测试完成！`);
  console.log(`✅ 通过: ${passedTests}`);
  console.log(`❌ 失败: ${failedTests}`);
  console.log(`总计: ${passedTests + failedTests}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 所有API接口测试通过！前端兼容性问题已解决。');
  } else {
    console.log('\n⚠️  仍有部分接口存在问题，需要进一步检查。');
  }
}

// 运行测试
runTests().catch(console.error);