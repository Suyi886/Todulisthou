# 游戏充值支付系统 - 客户对接API文档

## 概述

本文档为游戏充值支付系统的客户对接API文档，提供完整的接口说明、签名规则和集成指南。

## 基础信息

### 基础URL
- **生产环境**: `https://your-domain.com/api/game-recharge`
- **测试环境**: `http://localhost:3000/api/game-recharge`

### 请求格式
- 请求方式: `POST`
- 请求头: `Content-Type: application/json`
- 字符编码: `UTF-8`

## 签名规则

### 签名算法
使用MD5算法对参数进行签名验证，确保数据传输安全。

### 签名步骤
1. 将所有请求参数（除sign外）按参数名ASCII码从小到大排序
2. 使用URL键值对的格式（key=value&key=value...）拼接成字符串
3. 在字符串末尾拼接商户密钥（secret_key）
4. 对拼接后的字符串进行MD5加密，得到32位小写字符串

### 签名示例
```javascript
// 原始参数
const params = {
  order_id: "ORDER123456",
  amount: "100.00",
  code: "CN",
  api_key: "your_api_key"
};

// 1. 参数排序并拼接
const sortedParams = "amount=100.00&api_key=your_api_key&code=CN&order_id=ORDER123456";

// 2. 拼接密钥
const stringToSign = sortedParams + "your_secret_key";

// 3. MD5加密
const sign = md5(stringToSign).toLowerCase();
```

## 核心接口

## 商户密钥配置

### 密钥说明

在开始对接之前，您需要从平台方获取以下密钥信息：

| 密钥类型 | 参数名 | 长度 | 用途 | 示例 |
|----------|--------|------|------|------|
| API密钥 | api_key | 64位 | API调用身份验证 | `b3a730f6c15e4c2566d4b5bc5abf5e36783dbdc626dbb2ac32bf9ce0b25fec4c` |
| 签名密钥 | secret_key | 64位 | 请求签名验证 | `2325417b74c40d714deefeb51b3cab84f1a49e6282f89cc08df246765d784275` |

### 密钥获取流程

1. **联系平台方**：向平台技术支持申请商户账号
2. **提供信息**：提供您的商户标识（merchant_id）和回调地址
3. **获取密钥**：平台方会为您生成并提供 `api_key` 和 `secret_key`
4. **妥善保管**：请将密钥信息安全保存，避免泄露

### 1. 创建订单接口

#### 接口地址
`POST /orders/create`

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| order_id | string | 是 | 商户订单号，唯一标识 |
| amount | string | 是 | 订单金额，格式："100.00" |
| code | string | 是 | 国家代码，如："CN"、"US" |
| api_key | string | 是 | 商户API密钥 |
| sign | string | 是 | 签名字符串 |
| syn_callback_url | string | 否 | 同步回调地址 |
| notify_url | string | 否 | 异步通知地址 |

#### 请求示例
```json
{
  "order_id": "ORDER123456",
  "amount": "100.00",
  "code": "CN",
  "api_key": "your_api_key",
  "sign": "calculated_signature",
  "syn_callback_url": "https://your-site.com/callback",
  "notify_url": "https://your-site.com/notify"
}
```

#### 响应参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 请求是否成功 |
| platform_order_id | string | 平台订单号 |
| amount | string | 订单金额 |
| pay_url | string | 收银台支付链接 |
| message | string | 响应消息 |

#### 响应示例
```json
{
  "success": true,
  "platform_order_id": "PLT202312010001",
  "amount": "100.00",
  "pay_url": "http://localhost:3000/cashier.html?order=PLT202312010001",
  "message": "订单创建成功"
}
```

### 2. 查询订单接口

#### 接口地址
`POST /orders/query`

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| order_id | string | 是 | 商户订单号 |
| api_key | string | 是 | 商户API密钥 |
| sign | string | 是 | 签名字符串 |

#### 请求示例
```json
{
  "order_id": "ORDER123456",
  "api_key": "your_api_key",
  "sign": "calculated_signature"
}
```

#### 响应参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 请求是否成功 |
| order_id | string | 商户订单号 |
| platform_order_id | string | 平台订单号 |
| amount | string | 订单金额 |
| actual_amount | string | 实际金额 |
| status | integer | 订单状态 |
| status_text | string | 状态描述 |
| created_at | string | 创建时间 |
| submitted_at | string | 提交时间 |
| callback_at | string | 回调时间 |

### 3. 收银台相关接口

收银台接口主要供前端页面调用，客户网站通常不需要直接调用。

#### 获取收银台信息
`GET /cashier/{platform_order_id}`

#### 提交支付凭证
`POST /cashier/submit-payment`

#### 获取订单状态
`GET /cashier/status/{platform_order_id}`

## 订单状态说明

| 状态值 | 状态名称 | 说明 |
|--------|----------|------|
| 0 | 待付款 | 订单已创建，等待用户付款 |
| 1 | 已提交凭证 | 用户已提交支付凭证，等待审核 |
| 2 | 支付成功 | 订单支付成功，充值完成 |
| 3 | 支付失败 | 订单支付失败或被拒绝 |
| 4 | 已取消 | 订单已取消 |
| 5 | 已退款 | 订单已退款 |

## 回调通知

### 异步通知
当订单状态发生变化时，系统会向商户提供的 `notify_url` 发送POST请求。

#### 通知参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| order_id | string | 商户订单号 |
| platform_order_id | string | 平台订单号 |
| amount | string | 订单金额 |
| actual_amount | string | 实际金额 |
| status | integer | 订单状态 |
| sign | string | 签名 |

#### 通知示例
```json
{
  "order_id": "ORDER123456",
  "platform_order_id": "PLT202312010001",
  "amount": "100.00",
  "actual_amount": "100.00",
  "status": 2,
  "sign": "calculated_signature"
}
```

#### 响应要求
商户收到通知后，需要返回字符串 `"success"` 表示接收成功。

## 集成流程

### 1. 商户网站集成步骤

1. **获取商户配置**
   - 联系平台获取 `api_key` 和 `secret_key`
   - 配置回调地址

2. **创建订单**
   - 用户在商户网站选择充值金额
   - 商户调用创建订单接口
   - 获取支付链接 `pay_url`

3. **跳转支付**
   - 将用户重定向到 `pay_url`
   - 用户在收银台完成支付

4. **处理回调**
   - 接收异步通知
   - 验证签名
   - 更新订单状态

### 2. 代码示例（Node.js）

```javascript
const crypto = require('crypto');
const axios = require('axios');

// 生成签名
function generateSign(params, secretKey) {
  const sortedKeys = Object.keys(params).sort();
  const queryString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&');
  const stringToSign = queryString + secretKey;
  return crypto.createHash('md5').update(stringToSign).digest('hex');
}

// 创建订单
async function createOrder(orderData) {
  const params = {
    order_id: orderData.orderId,
    amount: orderData.amount,
    code: orderData.countryCode,
    api_key: 'your_api_key'
  };
  
  params.sign = generateSign(params, 'your_secret_key');
  
  try {
    const response = await axios.post(
      'http://localhost:3000/api/game-recharge/orders/create',
      params
    );
    return response.data;
  } catch (error) {
    console.error('创建订单失败:', error);
    throw error;
  }
}

// 查询订单
async function queryOrder(orderId) {
  const params = {
    order_id: orderId,
    api_key: 'your_api_key'
  };
  
  params.sign = generateSign(params, 'your_secret_key');
  
  try {
    const response = await axios.post(
      'http://localhost:3000/api/game-recharge/orders/query',
      params
    );
    return response.data;
  } catch (error) {
    console.error('查询订单失败:', error);
    throw error;
  }
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 签名验证失败 |
| 404 | 订单不存在 |
| 409 | 订单已存在 |
| 500 | 服务器内部错误 |

## 安全注意事项

1. **密钥安全**
   - 妥善保管 `secret_key`，不要在前端代码中暴露
   - 定期更换密钥

2. **签名验证**
   - 所有请求都必须进行签名验证
   - 验证回调通知的签名

3. **HTTPS传输**
   - 生产环境建议使用HTTPS协议
   - 确保数据传输安全

4. **订单幂等性**
   - 相同的 `order_id` 只能创建一次订单
   - 避免重复提交

## 测试环境

### 测试配置
- 基础URL: `http://localhost:3000/api/game-recharge`
- 测试API密钥: 联系技术支持获取
- 测试密钥: 联系技术支持获取

### 测试用例
```bash
# 创建订单测试
curl -X POST http://localhost:3000/api/game-recharge/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST123456",
    "amount": "100.00",
    "code": "CN",
    "api_key": "test_api_key",
    "sign": "calculated_signature"
  }'

# 查询订单测试
curl -X POST http://localhost:3000/api/game-recharge/orders/query \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST123456",
    "api_key": "test_api_key",
    "sign": "calculated_signature"
  }'
```

## 技术支持

如有技术问题，请联系：
- 邮箱: support@example.com
- 电话: 400-xxx-xxxx
- 工作时间: 周一至周五 9:00-18:00

## 更新日志

### v1.0.0 (2023-12-01)
- 初始版本发布
- 支持创建订单、查询订单功能
- 支持收银台支付流程
- 支持异步回调通知