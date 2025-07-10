const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @route POST /api/auth/register
 * @desc 用户注册
 * @access Public
 */
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('用户名长度必须在3-50个字符之间'),
    body('email')
      .isEmail()
      .withMessage('请提供有效的电子邮箱'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码长度必须至少为6个字符')
      .matches(/\d/)
      .withMessage('密码必须包含至少一个数字')
      .matches(/[a-zA-Z]/)
      .withMessage('密码必须包含至少一个字母'),
    validateRequest
  ],
  register
);

/**
 * @route POST /api/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post(
  '/login',
  [
    body('username')
      .notEmpty()
      .withMessage('用户名不能为空'),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空'),
    validateRequest
  ],
  login
);

module.exports = router;