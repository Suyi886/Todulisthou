const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * 认证中间件
 * 验证请求头中的JWT令牌
 */
const auth = (req, res, next) => {
  // 获取请求头中的Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: '未提供认证令牌'
      }
    });
  }

  // 提取令牌
  const token = authHeader.split(' ')[1];

  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 将用户信息添加到请求对象
    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: '无效或过期的令牌'
      }
    });
  }
};

module.exports = auth;