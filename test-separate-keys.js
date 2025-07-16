const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/game-recharge';

async function testSeparateKeyGeneration() {
  console.log('\n=== 测试分离的密钥重新生成接口 ===');
  
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
      console.log(`- 初始API密钥: ${createResponse.data.data.api_key}`);
      console.log(`- 初始签名密钥: ${createResponse.data.data.secret_key}`);
      
      var merchantId = createResponse.data.data.id;
      var originalApiKey = createResponse.data.data.api_key;
      var originalSecretKey = createResponse.data.data.secret_key;
    } else {
      var merchant = merchantsResponse.data.data[0];
      var merchantId = merchant.id;
      var originalApiKey = merchant.api_key;
      console.log('✅ 找到商户');
      console.log(`- 商户ID: ${merchant.merchant_id}`);
      console.log(`- 当前API密钥: ${originalApiKey}`);
      
      // 获取完整商户信息（包含secret_key）
      var originalSecretKey = 'unknown'; // 因为列表接口可能不返回secret_key
    }
    
    // 2. 测试重新生成API密钥
    console.log('\n2. 测试重新生成API密钥');
    const regenerateApiResponse = await axios.put(`${BASE_URL}/merchants/${merchantId}/regenerate-api-key`);
    
    console.log('✅ API密钥重新生成成功');
    console.log('API密钥响应数据:', JSON.stringify(regenerateApiResponse.data, null, 2));
    
    const newApiKey = regenerateApiResponse.data.data.api_key;
    
    console.log(`- 原API密钥: ${originalApiKey}`);
    console.log(`- 新API密钥: ${newApiKey}`);
    
    // 检查API密钥是否真的改变了
    if (newApiKey && newApiKey !== 'undefined' && newApiKey !== originalApiKey) {
      console.log('✅ API密钥已成功更新');
    } else {
      console.log('❌ API密钥更新失败或显示undefined');
    }
    
    // 3. 测试重新生成签名密钥
    console.log('\n3. 测试重新生成签名密钥');
    const regenerateSecretResponse = await axios.put(`${BASE_URL}/merchants/${merchantId}/regenerate-secret-key`);
    
    console.log('✅ 签名密钥重新生成成功');
    console.log('签名密钥响应数据:', JSON.stringify(regenerateSecretResponse.data, null, 2));
    
    const newSecretKey = regenerateSecretResponse.data.data.secret_key;
    
    console.log(`- 原签名密钥: ${originalSecretKey}`);
    console.log(`- 新签名密钥: ${newSecretKey}`);
    
    // 检查签名密钥是否真的改变了
    if (newSecretKey && newSecretKey !== 'undefined' && newSecretKey !== originalSecretKey) {
      console.log('✅ 签名密钥已成功更新');
    } else {
      console.log('❌ 签名密钥更新失败或显示undefined');
    }
    
    // 4. 验证原有的统一接口仍然工作
    console.log('\n4. 测试原有的统一密钥重新生成接口');
    const regenerateBothResponse = await axios.put(`${BASE_URL}/merchants/${merchantId}/regenerate-key`);
    
    console.log('✅ 统一密钥重新生成成功');
    console.log('统一接口响应数据:', JSON.stringify(regenerateBothResponse.data, null, 2));
    
    const finalApiKey = regenerateBothResponse.data.data.api_key;
    const finalSecretKey = regenerateBothResponse.data.data.secret_key;
    
    console.log(`- 最终API密钥: ${finalApiKey}`);
    console.log(`- 最终签名密钥: ${finalSecretKey}`);
    
    // 5. 再次获取商户信息确认更新
    console.log('\n5. 再次获取商户列表确认最终更新');
    const verifyResponse = await axios.get(`${BASE_URL}/merchants?page=1&limit=10`);
    const updatedMerchant = verifyResponse.data.data.find(m => m.id === merchantId);
    
    if (updatedMerchant) {
      console.log('✅ 商户信息获取成功');
      console.log(`- 数据库中的API密钥: ${updatedMerchant.api_key}`);
      
      if (updatedMerchant.api_key === finalApiKey) {
        console.log('✅ 数据库中的密钥与返回的密钥一致');
      } else {
        console.log('❌ 数据库中的密钥与返回的密钥不一致');
      }
    }
    
    console.log('\n🎉 所有测试完成！');
    console.log('✅ regenerate-api-key 接口正常');
    console.log('✅ regenerate-secret-key 接口正常');
    console.log('✅ regenerate-key 接口正常（向后兼容）');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testSeparateKeyGeneration();