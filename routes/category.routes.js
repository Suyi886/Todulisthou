const express = require('express');
const router = express.Router();
const { createCategory, getCategories, updateCategory, deleteCategory } = require('../controllers/category.controller');
const auth = require('../middleware/auth');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @route POST /api/categories
 * @desc 创建分类
 * @access Private
 */
router.post(
  '/',
  [
    auth,
    body('name')
      .notEmpty()
      .withMessage('分类名称不能为空'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('颜色格式必须是有效的十六进制颜色代码'),
    validateRequest
  ],
  createCategory
);

/**
 * @route GET /api/categories
 * @desc 获取用户分类列表
 * @access Private
 */
router.get('/', auth, getCategories);

/**
 * @route PUT /api/categories/:categoryId
 * @desc 更新分类
 * @access Private
 */
router.put(
  '/:categoryId',
  [
    auth,
    param('categoryId')
      .isInt({ min: 1 })
      .withMessage('分类ID必须是大于0的整数'),
    body('name')
      .optional()
      .notEmpty()
      .withMessage('分类名称不能为空'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('颜色格式必须是有效的十六进制颜色代码'),
    validateRequest
  ],
  updateCategory
);

/**
 * @route DELETE /api/categories/:categoryId
 * @desc 删除分类
 * @access Private
 */
router.delete(
  '/:categoryId',
  [
    auth,
    param('categoryId')
      .isInt({ min: 1 })
      .withMessage('分类ID必须是大于0的整数'),
    validateRequest
  ],
  deleteCategory
);

module.exports = router;