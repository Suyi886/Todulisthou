-- 游戏充值订单表
CREATE TABLE `game_recharge_orders` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` varchar(100) NOT NULL COMMENT '商户订单号',
  `platform_order_id` varchar(100) DEFAULT NULL COMMENT '系统订单号',
  `amount` decimal(10,2) NOT NULL COMMENT '订单金额',
  `actual_amount` decimal(10,2) DEFAULT NULL COMMENT '实际收款金额',
  `code` varchar(20) NOT NULL COMMENT '国家编号',
  `api_key` varchar(100) NOT NULL COMMENT '商户API密钥',
  `sign` varchar(500) NOT NULL COMMENT '签名',
  `syn_callback_url` varchar(500) DEFAULT NULL COMMENT '同步跳转地址',
  `notify_url` varchar(500) DEFAULT NULL COMMENT '回调地址',
  `pay_url` varchar(500) DEFAULT NULL COMMENT '收银台地址',
  `callback_str` varchar(500) DEFAULT NULL COMMENT '付款凭证字符串',
  `callback_img` varchar(500) DEFAULT NULL COMMENT '付款凭证图片路径',
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '订单状态：0-待付款，1-已提交凭证，10-成功，20-失败(未收到资金)，40-失败(资金冻结)，50-失败(资金返回)',
  `error_msg` varchar(500) DEFAULT NULL COMMENT '错误信息',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `submitted_at` timestamp NULL DEFAULT NULL COMMENT '提交凭证时间',
  `callback_at` timestamp NULL DEFAULT NULL COMMENT '回调时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_id` (`order_id`),
  KEY `idx_platform_order_id` (`platform_order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='游戏充值订单表';

-- 商户配置表
CREATE TABLE `merchant_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `merchant_id` varchar(50) NOT NULL COMMENT '商户ID',
  `api_key` varchar(100) NOT NULL COMMENT 'API密钥',
  `secret_key` varchar(100) NOT NULL COMMENT '签名密钥',
  `callback_url` varchar(500) DEFAULT NULL COMMENT '默认回调地址',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_merchant_id` (`merchant_id`),
  UNIQUE KEY `uk_api_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商户配置表';

-- 回调记录表
CREATE TABLE `callback_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` varchar(100) NOT NULL COMMENT '商户订单号',
  `platform_order_id` varchar(100) NOT NULL COMMENT '系统订单号',
  `callback_url` varchar(500) NOT NULL COMMENT '回调地址',
  `callback_data` text NOT NULL COMMENT '回调数据',
  `response_code` int(11) DEFAULT NULL COMMENT '响应状态码',
  `response_body` text DEFAULT NULL COMMENT '响应内容',
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '回调状态：0-失败，1-成功',
  `retry_count` int(11) NOT NULL DEFAULT 0 COMMENT '重试次数',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_platform_order_id` (`platform_order_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='回调记录表';

-- 国家编号配置表
CREATE TABLE `country_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `code` varchar(20) NOT NULL COMMENT '国家编号',
  `name` varchar(100) NOT NULL COMMENT '国家名称',
  `currency` varchar(10) NOT NULL COMMENT '货币编号',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='国家编号配置表';

-- 插入一些示例数据
INSERT INTO `merchant_config` (`merchant_id`, `api_key`, `secret_key`, `callback_url`, `status`) VALUES
('merchant_001', 'api_key_001', 'secret_key_001', 'https://example.com/callback', 1);

INSERT INTO `country_codes` (`code`, `name`, `currency`, `status`) VALUES
('CN', '中国', 'CNY', 1),
('US', '美国', 'USD', 1),
('JP', '日本', 'JPY', 1);