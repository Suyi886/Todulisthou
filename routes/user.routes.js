const express = require('express');
const router = express.Router();
const { getCurrentUser, updateUser, updatePassword } = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @route GET /api/users/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get('/me', auth, getCurrentUser);

/**
 * @route PUT /api/users/me
 * @desc 更新用户信息
 * @access Private
 */
router.put(
  '/me',
  [
    auth,
    body('email')
      .optional()
      .isEmail()
      .withMessage('请提供有效的电子邮箱'),
    validateRequest
  ],
  updateUser
);

/**
 * @route PUT /api/users/me/password
 * @desc 更新用户密码
 * @access Private
 */
router.put(
  '/me/password',
  [
    auth,
    body('current_password')
      .notEmpty()
      .withMessage('当前密码不能为空'),
    body('new_password')
      .isLength({ min: 6 })
      .withMessage('新密码长度必须至少为6个字符')
      .matches(/\d/)
      .withMessage('新密码必须包含至少一个数字')
      .matches(/[a-zA-Z]/)
      .withMessage('新密码必须包含至少一个字母'),
    validateRequest
  ],
  updatePassword
);

module.exports = router;