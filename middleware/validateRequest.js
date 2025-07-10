const { validationResult } = require('express-validator');

/**
 * 请求验证中间件
 * 用于验证express-validator的验证结果
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.array()[0].msg
      }
    });
  }
  next();
};

module.exports = validateRequest;