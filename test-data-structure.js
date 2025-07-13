const http = require('http');

// 测试API数据结构
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
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

async function testDataStructure() {
  console.log('测试API数据结构...');
  
  try {
    const result = await makeRequest('http://localhost:3000/api/game-recharge/orders?page=1&limit=5');
    
    if (result.statusCode === 200) {
      const response = result.data;
      
      console.log('✅ API响应成功');
      console.log('响应结构:');
      console.log('- status:', response.status);
      console.log('- data类型:', Array.isArray(response.data) ? 'Array' : typeof response.data);
      console.log('- data长度:', Array.isArray(response.data) ? response.data.length : 'N/A');
      console.log('- pagination存在:', !!response.pagination);
      
      if (response.pagination) {
        console.log('- pagination结构:', {
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages
        });
      }
      
      // 验证数据结构
      if (response.status === 'success' && Array.isArray(response.data)) {
        console.log('\n🎉 数据结构正确！');
        console.log('- data字段是数组类型，符合ElTable组件要求');
        console.log('- pagination信息独立存在，便于前端处理分页');
      } else {
        console.log('\n❌ 数据结构有问题');
        if (response.status !== 'success') {
          console.log('- status字段不是success');
        }
        if (!Array.isArray(response.data)) {
          console.log('- data字段不是数组类型');
        }
      }
      
    } else {
      console.log('❌ API请求失败，状态码:', result.statusCode);
    }
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }
}

// 运行测试
testDataStructure();