const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/game-recharge';

async function testSecretKeyFix() {
  try {
    console.log('=== 测试 secret_key 字段修复 ===\n');
    
    // 1. 获取商户列表，检查是否包含 secret_key
    console.log('1. 测试获取商户列表...');
    const merchantsResponse = await axios.get(`${BASE_URL}/merchants`);
    
    if (merchantsResponse.data.status === 'success') {
      console.log('✅ 获取商户列表成功');
      const merchants = merchantsResponse.data.data;
      
      if (merchants.length > 0) {
        const firstMerchant = merchants[0];
        console.log('商户数据示例:');
        console.log(`- ID: ${firstMerchant.id}`);
        console.log(`- merchant_id: ${firstMerchant.merchant_id}`);
        console.log(`- api_key: ${firstMerchant.api_key ? '存在' : '缺失'}`);
        console.log(`- secret_key: ${firstMerchant.secret_key ? '存在' : '缺失'}`);
        
        if (firstMerchant.secret_key && firstMerchant.secret_key !== 'undefined') {
          console.log('✅ secret_key 字段正常返回');
        } else {
          console.log('❌ secret_key 字段缺失或为 undefined');
        }
        
        // 2. 测试更新商户，检查返回数据是否包含 secret_key
        console.log('\n2. 测试更新商户...');
        const updateResponse = await axios.put(`${BASE_URL}/merchants/${firstMerchant.id}`, {
          callback_url: firstMerchant.callback_url || 'https://test.example.com/callback'
        });
        
        if (updateResponse.data.status === 'success') {
          console.log('✅ 更新商户成功');
          const updatedMerchant = updateResponse.data.data;
          console.log('更新后的商户数据:');
          console.log(`- ID: ${updatedMerchant.id}`);
          console.log(`- merchant_id: ${updatedMerchant.merchant_id}`);
          console.log(`- api_key: ${updatedMerchant.api_key ? '存在' : '缺失'}`);
          console.log(`- secret_key: ${updatedMerchant.secret_key ? '存在' : '缺失'}`);
          
          if (updatedMerchant.secret_key && updatedMerchant.secret_key !== 'undefined') {
            console.log('✅ 更新接口 secret_key 字段正常返回');
          } else {
            console.log('❌ 更新接口 secret_key 字段缺失或为 undefined');
          }
        } else {
          console.log('❌ 更新商户失败:', updateResponse.data.msg);
        }
        
      } else {
        console.log('⚠️ 商户列表为空，无法测试');
      }
    } else {
      console.log('❌ 获取商户列表失败:', merchantsResponse.data.msg);
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testSecretKeyFix();