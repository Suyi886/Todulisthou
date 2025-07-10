/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // 默认错误响应
  const errorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误'
    }
  };

  // 处理验证错误
  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    errorResponse.error.code = 'VALIDATION_ERROR';
    errorResponse.error.message = err.message;
    return res.status(400).json(errorResponse);
  }

  // 处理JWT错误
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    errorResponse.error.code = 'INVALID_TOKEN';
    errorResponse.error.message = '无效或过期的令牌';
    return res.status(401).json(errorResponse);
  }

  // 处理权限错误
  if (err.name === 'ForbiddenError') {
    errorResponse.error.code = 'FORBIDDEN';
    errorResponse.error.message = '无权访问该资源';
    return res.status(403).json(errorResponse);
  }

  // 处理资源不存在错误
  if (err.name === 'NotFoundError') {
    errorResponse.error.code = 'NOT_FOUND';
    errorResponse.error.message = '资源不存在';
    return res.status(404).json(errorResponse);
  }

  // 处理重复实体错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    errorResponse.error.code = 'DUPLICATE_ENTITY';
    errorResponse.error.message = '资源已存在';
    return res.status(409).json(errorResponse);
  }

  // 自定义错误
  if (err.statusCode && err.code) {
    errorResponse.error.code = err.code;
    errorResponse.error.message = err.message;
    return res.status(err.statusCode).json(errorResponse);
  }

  // 默认返回500错误
  res.status(500).json(errorResponse);
};

module.exports = errorHandler;