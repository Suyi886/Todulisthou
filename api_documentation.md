# 游戏充值平台对接API文档

## 基础信息

- **基础URL**: `http://your-domain.com/api/game-recharge`
- **所有接口都需要进行签名验证**
- **签名算法**: MD5

## 签名规则

1. 将所有请求参数的参数名，以ASCII码进行由小到大的排序
2. 将排序后的参数，以键值对方式组成字符串，最后拼接`&key=API_SECRET`
3. 将第2步的字符串，进行MD5，即可得到sign参数值（32位小写）

**示例**:
假设请求参数：
```json
{
    "order_id": "CLIENT1717268630",
    "amount": "1000",
    "api_key": "your_api_key",
    "code": "CN"
}
```

排序后拼接字符串：
```
amount=1000&api_key=your_api_key&code=CN&order_id=CLIENT1717268630&key=your_secret_key
```

MD5后得到sign值。

## 1. 创建订单接口

### 接口信息
- **URL**: `/api/game-recharge/createOrderMain`
- **请求方式**: POST
- **Content-Type**: application/json

### 请求参数

| 参数名 | 是否必填 | 类型 | 描述 |
|--------|----------|------|------|
| order_id | 是 | string | 商户自己的订单号（唯一） |
| amount | 是 | number | 订单金额 |
| code | 是 | string | 国家编号（如：CN、US等） |
| api_key | 是 | string | 商户API密钥 |
| sign | 是 | string | 签名 |
| syn_callback_url | 否 | string | 同步跳转地址 |
| notify_url | 否 | string | 异步回调地址 |

### 请求示例
```json
{
    "order_id": "SSDOINE2389743209",
    "amount": 1000,
    "code": "CN",
    "api_key": "your_api_key",
    "sign": "calculated_sign",
    "syn_callback_url": "https://your-site.com/callback",
    "notify_url": "https://your-site.com/notify"
}
```

### 响应示例
```json
// 成功
{
    "status": "success",
    "msg": "success",
    "data": {
        "platform_order_id": "P1703241400119184490",
        "amount": 1000,
        "pay_url": "https://cashier.example.com/pay/P1703241400119184490"
    }
}

// 失败
{
    "status": "error",
    "msg": "失败原因",
    "code": 400,
    "data": {}
}
```

## 2. 提交订单接口

### 接口信息
- **URL**: `/api/game-recharge/submitOrder`
- **请求方式**: POST
- **Content-Type**: multipart/form-data

### 请求参数

| 参数名 | 是否必填 | 类型 | 描述 |
|--------|----------|------|------|
| order_id | 是 | string | 商户订单号 |
| platform_order_id | 是 | string | 系统订单号 |
| callback_str | 否 | string | 付款凭证字符串（与callback_img二选一） |
| callback_img | 否 | file | 付款凭证图片（与callback_str二选一，支持jpg/png/gif，最大5MB） |
| api_key | 是 | string | 商户API密钥 |
| sign | 是 | string | 签名 |

**注意**: callback_str 和 callback_img 必须提供其中一个作为付款凭证。

### 请求示例
```javascript
// 使用字符串凭证
const formData = new FormData();
formData.append('order_id', 'SSDFEWI76877908');
formData.append('platform_order_id', 'P1703241400119184490');
formData.append('callback_str', 'payment_transaction_12345');
formData.append('api_key', 'your_api_key');
formData.append('sign', 'calculated_sign');

// 或使用图片凭证
const formData2 = new FormData();
formData2.append('order_id', 'SSDFEWI76877908');
formData2.append('platform_order_id', 'P1703241400119184490');
formData2.append('callback_img', fileInput.files[0]); // 图片文件
formData2.append('api_key', 'your_api_key');
formData2.append('sign', 'calculated_sign');
```

### 响应示例
```json
// 成功
{
    "status": "success",
    "msg": "success",
    "data": []
}

// 失败
{
    "status": "error",
    "msg": "失败原因",
    "code": 400,
    "data": {}
}
```

## 3. 查询订单接口

### 接口信息
- **URL**: `/api/game-recharge/queryOrder`
- **请求方式**: POST
- **Content-Type**: application/json

### 请求参数

| 参数名 | 是否必填 | 类型 | 描述 |
|--------|----------|------|------|
| order_id | 是 | string | 商户订单号 |
| api_key | 是 | string | 商户API密钥 |
| sign | 是 | string | 签名 |

### 请求示例
```json
{
    "order_id": "SSDOINE2389743209",
    "api_key": "your_api_key",
    "sign": "calculated_sign"
}
```

### 响应示例
```json
// 成功
{
    "status": "success",
    "msg": "success",
    "data": {
        "order_id": "SSDOINE2389743209",
        "platform_order_id": "P1703241400119184490",
        "amount": 1000.00,
        "actual_amount": 1000.00,
        "status": 0,
        "created_at": "2024-01-01T10:00:00.000Z",
        "submitted_at": "2024-01-01T10:05:00.000Z",
        "callback_at": "2024-01-01T10:10:00.000Z",
        "country": {
            "name": "中国",
            "currency": "CNY"
        }
    }
}

// 失败
{
    "status": "error",
    "msg": "失败原因",
    "code": 400,
    "data": {}
}
```

### 订单状态说明

| 状态值 | 状态描述 |
|--------|----------|
| 0 | 待提交凭证 |
| 1 | 已提交凭证，待审核 |
| 2 | 审核通过，充值成功 |
| 3 | 审核拒绝 |
| 4 | 订单取消 |

## 4. 获取国家列表接口

### 接口信息
- **URL**: `/api/game-recharge/countries`
- **请求方式**: GET
- **Content-Type**: application/json

### 请求参数
无需参数

### 响应示例
```json
{
    "status": "success",
    "data": [
        {
            "code": "CN",
            "name": "中国",
            "currency": "CNY"
        },
        {
            "code": "US",
            "name": "美国",
            "currency": "USD"
        },
        {
            "code": "JP",
            "name": "日本",
            "currency": "JPY"
        }
    ]
}
```

## 5. 获取商户列表接口（管理接口）

### 接口信息
- **URL**: `/api/game-recharge/merchants`
- **请求方式**: GET
- **Content-Type**: application/json

### 请求参数
无需参数

### 响应示例
```json
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "merchant_id": "MERCHANT_001",
            "api_key": "your_api_key",
            "status": 1,
            "created_at": "2024-01-01T10:00:00.000Z"
        }
    ]
}
```

## 错误码说明

| 错误码 | 错误描述 |
|--------|----------|
| 400 | 请求参数错误 |
| 401 | 签名验证失败 |
| 403 | 商户权限不足 |
| 404 | 订单不存在 |
| 500 | 服务器内部错误 |

## 注意事项

1. 所有接口都需要进行签名验证
2. 签名使用MD5算法，生成32位小写字符串
3. 文件上传仅支持图片格式，最大5MB
4. 订单号必须唯一，重复提交会返回错误
5. 建议在生产环境中使用HTTPS协议