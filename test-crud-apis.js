const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/game-recharge';

// 测试商户管理API
async function testMerchantAPIs() {
  console.log('\n=== 测试商户管理API ===');
  
  try {
    // 1. 获取商户列表
    console.log('\n1. 测试获取商户列表');
    const merchantsResponse = await axios.get(`${BASE_URL}/merchants?page=1&limit=5`);
    console.log('✅ 获取商户列表成功');
    console.log(`- 状态: ${merchantsResponse.data.status}`);
    console.log(`- 数据类型: ${Array.isArray(merchantsResponse.data.data) ? 'Array' : typeof merchantsResponse.data.data}`);
    console.log(`- 数据长度: ${merchantsResponse.data.data.length}`);
    
    // 2. 创建商户
    console.log('\n2. 测试创建商户');
    const createMerchantData = {
      merchant_id: `TEST_MERCHANT_${Date.now()}`,
      callback_url: 'https://example.com/callback'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/merchants`, createMerchantData);
    console.log('✅ 创建商户成功');
    console.log(`- 状态: ${createResponse.data.status}`);
    console.log(`- 商户ID: ${createResponse.data.data.merchant_id}`);
    
    const merchantId = createResponse.data.data.id;
    
    // 3. 更新商户
    console.log('\n3. 测试更新商户');
    const updateData = {
      callback_url: 'https://updated-example.com/callback'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/merchants/${merchantId}`, updateData);
    console.log('✅ 更新商户成功');
    console.log(`- 状态: ${updateResponse.data.status}`);
    
    // 4. 切换商户状态
    console.log('\n4. 测试切换商户状态');
    const toggleResponse = await axios.put(`${BASE_URL}/merchants/${merchantId}/status`);
    console.log('✅ 切换商户状态成功');
    console.log(`- 状态: ${toggleResponse.data.status}`);
    
    // 5. 删除商户
    console.log('\n5. 测试删除商户');
    const deleteResponse = await axios.delete(`${BASE_URL}/merchants/${merchantId}`);
    console.log('✅ 删除商户成功');
    console.log(`- 状态: ${deleteResponse.data.status}`);
    
  } catch (error) {
    console.error('❌ 商户API测试失败:');
    console.error('- 错误信息:', error.message);
    if (error.response) {
      console.error('- 状态码:', error.response.status);
      console.error('- 响应数据:', error.response.data);
    }
  }
}

// 测试国家管理API
async function testCountryAPIs() {
  console.log('\n=== 测试国家管理API ===');
  
  try {
    // 1. 获取国家列表
    console.log('\n1. 测试获取国家列表');
    const countriesResponse = await axios.get(`${BASE_URL}/countries?page=1&limit=5`);
    console.log('✅ 获取国家列表成功');
    console.log(`- 状态: ${countriesResponse.data.status}`);
    console.log(`- 数据类型: ${Array.isArray(countriesResponse.data.data) ? 'Array' : typeof countriesResponse.data.data}`);
    console.log(`- 数据长度: ${countriesResponse.data.data.length}`);
    
    // 2. 创建国家
    console.log('\n2. 测试创建国家');
    const createCountryData = {
      code: `T${Date.now().toString().slice(-2)}`,
      name: `测试国家_${Date.now()}`,
      currency: 'USD'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/countries`, createCountryData);
    console.log('✅ 创建国家成功');
    console.log(`- 状态: ${createResponse.data.status}`);
    console.log(`- 国家编号: ${createResponse.data.data.code}`);
    
    const countryId = createResponse.data.data.id;
    
    // 3. 获取单个国家详情
    console.log('\n3. 测试获取国家详情');
    const detailResponse = await axios.get(`${BASE_URL}/countries/${countryId}`);
    console.log('✅ 获取国家详情成功');
    console.log(`- 状态: ${detailResponse.data.status}`);
    
    // 4. 更新国家
    console.log('\n4. 测试更新国家');
    const updateData = {
      name: `更新的测试国家_${Date.now()}`
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/countries/${countryId}`, updateData);
    console.log('✅ 更新国家成功');
    console.log(`- 状态: ${updateResponse.data.status}`);
    
    // 5. 切换国家状态
    console.log('\n5. 测试切换国家状态');
    const toggleResponse = await axios.put(`${BASE_URL}/countries/${countryId}/status`);
    console.log('✅ 切换国家状态成功');
    console.log(`- 状态: ${toggleResponse.data.status}`);
    
    // 6. 删除国家
    console.log('\n6. 测试删除国家');
    const deleteResponse = await axios.delete(`${BASE_URL}/countries/${countryId}`);
    console.log('✅ 删除国家成功');
    console.log(`- 状态: ${deleteResponse.data.status}`);
    
  } catch (error) {
    console.error('❌ 国家API测试失败:');
    console.error('- 错误信息:', error.message);
    if (error.response) {
      console.error('- 状态码:', error.response.status);
      console.error('- 响应数据:', error.response.data);
    }
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试商户和国家管理CRUD API...');
  
  await testMerchantAPIs();
  await testCountryAPIs();
  
  console.log('\n=== 所有测试完成 ===');
}

// 运行测试
runTests().catch(console.error);