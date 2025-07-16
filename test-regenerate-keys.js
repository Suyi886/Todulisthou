const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/game-recharge';

async function testRegenerateKeys() {
  console.log('\n=== 测试密钥重新生成功能 ===');
  
  try {
    // 1. 先获取商户列表，找到一个商户
    console.log('\n1. 获取商户列表');
    const merchantsResponse = await axios.get(`${BASE_URL}/merchants?page=1&limit=1`);
    
    if (!merchantsResponse.data.data || merchantsResponse.data.data.length === 0) {
      console.log('❌ 没有找到商户，先创建一个测试商户');
      
      // 创建测试商户
      const createData = {
        merchant_id: `TEST_MERCHANT_${Date.now()}`,
        callback_url: 'https://example.com/callback'
      };
      
      const createResponse = await axios.post(`${BASE_URL}/merchants`, createData);
      console.log('✅ 创建测试商户成功');
      console.log(`- 商户ID: ${createResponse.data.data.merchant_id}`);
      console.log(`- API密钥: ${createResponse.data.data.api_key}`);
      console.log(`- 签名密钥: ${createResponse.data.data.secret_key}`);
      
      var merchantId = createResponse.data.data.id;
      var oldApiKey = createResponse.data.data.api_key;
      var oldSecretKey = createResponse.data.data.secret_key;
    } else {
      var merchant = merchantsResponse.data.data[0];
      var merchantId = merchant.id;
      var oldApiKey = merchant.api_key;
      console.log('✅ 找到商户');
      console.log(`- 商户ID: ${merchant.merchant_id}`);
      console.log(`- 当前API密钥: ${oldApiKey}`);
      
      // 获取完整商户信息（包含secret_key）
      console.log('\n2. 获取商户详细信息');
      // 注意：这里需要一个获取单个商户详情的API，如果没有，我们跳过这步
      var oldSecretKey = 'unknown'; // 因为列表接口可能不返回secret_key
    }
    
    // 3. 重新生成密钥
    console.log('\n3. 重新生成密钥');
    const regenerateResponse = await axios.put(`${BASE_URL}/merchants/${merchantId}/regenerate-key`);
    
    console.log('✅ 密钥重新生成成功');
    console.log('响应数据:', JSON.stringify(regenerateResponse.data, null, 2));
    
    const newApiKey = regenerateResponse.data.data.api_key;
    const newSecretKey = regenerateResponse.data.data.secret_key;
    
    console.log(`\n4. 验证密钥是否已更新`);
    console.log(`- 旧API密钥: ${oldApiKey}`);
    console.log(`- 新API密钥: ${newApiKey}`);
    console.log(`- 旧签名密钥: ${oldSecretKey}`);
    console.log(`- 新签名密钥: ${newSecretKey}`);
    
    // 检查密钥是否真的改变了
    if (newApiKey && newApiKey !== 'undefined' && newApiKey !== oldApiKey) {
      console.log('✅ API密钥已成功更新');
    } else {
      console.log('❌ API密钥更新失败或显示undefined');
    }
    
    if (newSecretKey && newSecretKey !== 'undefined' && newSecretKey !== oldSecretKey) {
      console.log('✅ 签名密钥已成功更新');
    } else {
      console.log('❌ 签名密钥更新失败或显示undefined');
    }
    
    // 5. 再次获取商户信息确认更新
    console.log('\n5. 再次获取商户列表确认更新');
    const verifyResponse = await axios.get(`${BASE_URL}/merchants?page=1&limit=10`);
    const updatedMerchant = verifyResponse.data.data.find(m => m.id === merchantId);
    
    if (updatedMerchant) {
      console.log('✅ 商户信息获取成功');
      console.log(`- 数据库中的API密钥: ${updatedMerchant.api_key}`);
      
      if (updatedMerchant.api_key === newApiKey) {
        console.log('✅ 数据库中的密钥与返回的密钥一致');
      } else {
        console.log('❌ 数据库中的密钥与返回的密钥不一致');
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testRegenerateKeys();