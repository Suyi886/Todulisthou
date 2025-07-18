# 收银台功能API文档

## 概述

收银台功能为游戏充值平台提供了一个完整的支付页面解决方案。当客户在对接网站填写充值金额并创建订单后，会跳转到我们平台的收银台页面，用户可以在收银台页面查看订单详情并提交支付凭证。

## 业务流程

1. **客户网站创建订单**: 调用 `createOrderMain` 接口创建订单
2. **获取支付链接**: 接口返回 `pay_url`，指向我们的收银台页面
3. **跳转收银台**: 用户点击支付按钮，跳转到收银台页面
4. **查看订单信息**: 收银台页面自动加载并显示订单详情
5. **提交支付凭证**: 用户在收银台页面提交支付凭证
6. **状态更新**: 订单状态更新为"已提交凭证，待审核"
7. **后续处理**: 平台审核凭证，更新最终状态

## 收银台相关接口

### 1. 获取收银台页面信息

#### 接口信息
- **URL**: `/api/game-recharge/cashier/:platform_order_id`
- **请求方式**: GET
- **描述**: 根据平台订单号获取收银台页面所需的订单信息

#### 请求参数
| 参数名 | 位置 | 是否必填 | 类型 | 描述 |
|--------|------|----------|------|------|
| platform_order_id | URL路径 | 是 | string | 平台订单号 |

#### 请求示例
```http
GET /api/game-recharge/cashier/P1703241400119184490
```

#### 响应示例
```json
{
  "status": "success",
  "msg": "获取收银台信息成功",
  "data": {
    "platform_order_id": "P1703241400119184490",
    "order_id": "SSDOINE2389743209",
    "amount": 1000.00,
    "currency": "USD",
    "country_name": "中国",
    "country_code": "CN",
    "merchant_name": "测试商户",
    "status": 0,
    "status_text": "待付款",
    "created_at": "2023-12-22T14:30:00.000Z",
    "payment_methods": [
      {
        "type": "alipay",
        "name": "支付宝",
        "qr_code": "https://example.com/qr/alipay.png"
      },
      {
        "type": "wechat",
        "name": "微信支付",
        "qr_code": "https://example.com/qr/wechat.png"
      }
    ],
    "qr_code_url": "https://example.com/qr/payment.png",
    "bank_info": {
      "bank_name": "中国银行",
      "account_number": "1234567890",
      "account_name": "测试账户"
    }
  }
}
```

#### 错误响应
```json
{
  "status": "error",
  "msg": "订单不存在或状态不允许支付",
  "code": 404,
  "data": {}
}
```

### 2. 提交支付凭证

#### 接口信息
- **URL**: `/api/game-recharge/cashier/submit-payment`
- **请求方式**: POST
- **Content-Type**: multipart/form-data
- **描述**: 在收银台页面提交支付凭证

#### 请求参数
| 参数名 | 是否必填 | 类型 | 描述 |
|--------|----------|------|------|
| platform_order_id | 是 | string | 平台订单号 |
| callback_str | 否 | string | 付款凭证字符串（与callback_img二选一） |
| callback_img | 否 | file | 付款凭证图片（与callback_str二选一） |
| actual_amount | 否 | number | 实际支付金额 |
| payment_method | 否 | string | 支付方式 |

#### 请求示例
```javascript
const formData = new FormData();
formData.append('platform_order_id', 'P1703241400119184490');
formData.append('callback_str', '通过支付宝转账，交易号：2023122214300001');
formData.append('actual_amount', '1000.00');

fetch('/api/game-recharge/cashier/submit-payment', {
  method: 'POST',
  body: formData
});
```

#### 响应示例
```json
{
  "status": "success",
  "msg": "支付凭证提交成功，请等待审核",
  "data": {
    "platform_order_id": "P1703241400119184490",
    "status": 1,
    "status_text": "已提交凭证，待审核",
    "submitted_at": "2023-12-22T14:35:00.000Z"
  }
}
```

### 3. 获取订单支付状态

#### 接口信息
- **URL**: `/api/game-recharge/cashier/status/:platform_order_id`
- **请求方式**: GET
- **描述**: 获取订单的实时支付状态

#### 请求参数
| 参数名 | 位置 | 是否必填 | 类型 | 描述 |
|--------|------|----------|------|------|
| platform_order_id | URL路径 | 是 | string | 平台订单号 |

#### 请求示例
```http
GET /api/game-recharge/cashier/status/P1703241400119184490
```

#### 响应示例
```json
{
  "status": "success",
  "msg": "获取订单状态成功",
  "data": {
    "platform_order_id": "P1703241400119184490",
    "order_id": "SSDOINE2389743209",
    "status": 1,
    "status_text": "已提交凭证，待审核",
    "amount": 1000.00,
    "actual_amount": 1000.00,
    "created_at": "2023-12-22T14:30:00.000Z",
    "submitted_at": "2023-12-22T14:35:00.000Z",
    "updated_at": "2023-12-22T14:35:00.000Z",
    "error_msg": null
  }
}
```

### 4. 处理支付完成后的跳转

#### 接口信息
- **URL**: `/api/game-recharge/cashier/redirect/:platform_order_id`
- **请求方式**: GET
- **描述**: 处理支付完成后的页面跳转，如果订单有同步回调地址则重定向

#### 请求参数
| 参数名 | 位置 | 是否必填 | 类型 | 描述 |
|--------|------|----------|------|------|
| platform_order_id | URL路径 | 是 | string | 平台订单号 |

#### 请求示例
```http
GET /api/game-recharge/cashier/redirect/P1703241400119184490
```

#### 响应说明
- 如果订单有 `syn_callback_url`，则重定向到该地址，并附加订单参数
- 如果没有同步回调地址，则返回JSON格式的订单信息

#### 重定向示例
```http
HTTP/1.1 302 Found
Location: https://merchant-site.com/callback?platform_order_id=P1703241400119184490&order_id=SSDOINE2389743209&status=1&amount=1000.00
```

#### JSON响应示例
```json
{
  "status": "success",
  "msg": "支付处理完成",
  "data": {
    "platform_order_id": "P1703241400119184490",
    "order_id": "SSDOINE2389743209",
    "status": 1,
    "status_text": "已提交凭证，待审核",
    "amount": 1000.00
  }
}
```

## 订单状态说明

| 状态值 | 状态描述 | 说明 |
|--------|----------|------|
| 0 | 待付款 | 订单已创建，等待用户支付 |
| 1 | 已提交凭证，待审核 | 用户已提交支付凭证，等待平台审核 |
| 2 | 审核通过，充值成功 | 凭证审核通过，充值完成 |
| 10 | 充值成功 | 系统确认充值成功 |
| 20 | 失败(未收到资金) | 审核失败，未收到资金 |
| 40 | 失败(资金冻结) | 资金被冻结 |
| 50 | 失败(资金返回) | 资金已返回 |

## 收银台页面说明

### 页面访问地址
```
http://your-domain.com/cashier.html?order={platform_order_id}
```

### 页面功能
1. **订单信息展示**: 显示订单号、金额、商户名称、国家等信息
2. **支付方式展示**: 显示可用的支付方式和二维码
3. **凭证提交**: 支持文字说明和图片上传两种凭证提交方式
4. **状态实时更新**: 自动更新订单状态
5. **响应式设计**: 支持PC和移动端访问

### 页面状态处理
- **待付款状态**: 显示支付表单，允许提交凭证
- **已提交凭证**: 显示等待审核提示，隐藏支付表单
- **充值成功**: 显示成功提示
- **充值失败**: 显示失败原因

## 集成说明

### 1. 修改createOrderMain接口

原有的 `createOrderMain` 接口已经修改，现在返回的 `pay_url` 指向我们自己的收银台页面：

```javascript
// 原来的URL格式
"pay_url": "https://cashier.example.com/pay/P1703241400119184490"

// 现在的URL格式
"pay_url": "http://localhost:3000/cashier.html?order=P1703241400119184490"
```

### 2. 环境变量配置

可以通过环境变量 `CASHIER_BASE_URL` 配置收银台的基础URL：

```bash
# .env 文件
CASHIER_BASE_URL=https://your-domain.com
```

如果不设置，默认使用 `http://localhost:3000`

### 3. 前端集成建议

#### 3.1 收银台页面定制
现有的 `cashier.html` 是一个基础模板，前端开发人员可以根据需要进行以下定制：

- **样式调整**: 修改CSS样式以匹配品牌风格
- **支付方式**: 根据国家配置显示不同的支付方式
- **多语言支持**: 添加国际化支持
- **移动端优化**: 进一步优化移动端体验

#### 3.2 状态轮询
建议在收银台页面添加状态轮询功能，定期检查订单状态：

```javascript
// 每30秒检查一次订单状态
setInterval(async () => {
  const response = await fetch(`/api/game-recharge/cashier/status/${platformOrderId}`);
  const data = await response.json();
  
  if (data.status === 'success') {
    updateOrderStatus(data.data);
  }
}, 30000);
```

#### 3.3 错误处理
建议添加完善的错误处理机制：

- 网络错误重试
- 文件上传大小限制提示
- 表单验证
- 用户友好的错误提示

## 安全注意事项

1. **文件上传安全**: 已配置文件类型和大小限制，只允许图片文件，最大5MB
2. **订单状态验证**: 只允许特定状态的订单进行操作
3. **参数验证**: 所有接口都进行了严格的参数验证
4. **数据库事务**: 使用事务确保数据一致性

## 测试建议

### 1. 接口测试
```bash
# 测试获取收银台信息
curl -X GET "http://localhost:3000/api/game-recharge/cashier/P1703241400119184490"

# 测试提交支付凭证
curl -X POST "http://localhost:3000/api/game-recharge/cashier/submit-payment" \
  -F "platform_order_id=P1703241400119184490" \
  -F "callback_str=测试支付凭证" \
  -F "actual_amount=1000.00"

# 测试获取订单状态
curl -X GET "http://localhost:3000/api/game-recharge/cashier/status/P1703241400119184490"
```

### 2. 页面测试
1. 访问收银台页面：`http://localhost:3000/cashier.html?order=P1703241400119184490`
2. 测试不同订单状态下的页面显示
3. 测试文字凭证和图片凭证提交
4. 测试移动端兼容性

## 部署说明

1. **静态文件**: `cashier.html` 放在 `public` 目录下，确保可以直接访问
2. **文件上传**: 确保 `uploads/game-recharge/` 目录存在且有写权限
3. **环境变量**: 生产环境需要设置正确的 `CASHIER_BASE_URL`
4. **HTTPS**: 生产环境建议使用HTTPS确保安全性

## 后续扩展建议

1. **支付方式扩展**: 支持更多支付方式（银行卡、数字货币等）
2. **实时通知**: 使用WebSocket实现实时状态更新
3. **支付统计**: 添加支付成功率、平均处理时间等统计
4. **风控系统**: 添加反欺诈和风险控制机制
5. **客服集成**: 集成在线客服系统
6. **多币种支持**: 支持多种货币显示和计算

---

**注意**: 本文档描述的是收银台功能的后端接口实现，前端开发人员可以基于提供的接口和HTML模板进行进一步的开发和定制。