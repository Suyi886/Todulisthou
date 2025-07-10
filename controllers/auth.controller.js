const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

/**
 * 用户注册
 * @route POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_ENTITY',
          message: '用户名已存在'
        }
      });
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_ENTITY',
          message: '邮箱已被注册'
        }
      });
    }

    // 创建新用户
    const user = await User.create({
      username,
      email,
      password
    });

    // 返回用户信息（不包含密码）
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 用户登录
 * @route POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '用户名或密码不正确'
        }
      });
    }

    // 验证密码
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '用户名或密码不正确'
        }
      });
    }

    // 更新最后登录时间
    await user.update({ last_login: new Date() });

    // 创建JWT令牌
    const payload = {
      user: {
        id: user.id,
        username: user.username
      }
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: parseInt(process.env.JWT_EXPIRES_IN) || 3600 }
    );

    // 返回令牌
    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: parseInt(process.env.JWT_EXPIRES_IN) || 3600
    });
  } catch (error) {
    next(error);
  }
};