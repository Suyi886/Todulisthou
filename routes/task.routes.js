const express = require('express');
const router = express.Router();
const { createTask, getTasks, getTaskById, updateTask, deleteTask } = require('../controllers/task.controller');
const { createReminder } = require('../controllers/reminder.controller');
const { uploadAttachment } = require('../controllers/attachment.controller');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { body, query, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @route POST /api/tasks
 * @desc 创建任务
 * @access Private
 */
router.post(
  '/',
  [
    auth,
    body('title')
      .notEmpty()
      .withMessage('任务标题不能为空'),
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('截止日期格式无效'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('优先级必须是 low, medium 或 high'),
    body('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'archived'])
      .withMessage('状态必须是 pending, in_progress, completed 或 archived'),
    body('category_ids')
      .optional()
      .isArray()
      .withMessage('分类ID必须是数组'),
    validateRequest
  ],
  createTask
);

/**
 * @route GET /api/tasks
 * @desc 获取任务列表（带筛选）
 * @access Private
 */
router.get(
  '/',
  [
    auth,
    query('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'archived'])
      .withMessage('状态必须是 pending, in_progress, completed 或 archived'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('优先级必须是 low, medium 或 high'),
    query('due_date_after')
      .optional()
      .isISO8601()
      .withMessage('起始日期格式无效'),
    query('due_date_before')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是大于0的整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须是1-100之间的整数'),
    validateRequest
  ],
  getTasks
);

/**
 * @route GET /api/tasks/:taskId
 * @desc 获取单个任务详情
 * @access Private
 */
router.get(
  '/:taskId',
  [
    auth,
    param('taskId')
      .isInt({ min: 1 })
      .withMessage('任务ID必须是大于0的整数'),
    validateRequest
  ],
  getTaskById
);

/**
 * @route PUT /api/tasks/:taskId
 * @desc 更新任务
 * @access Private
 */
router.put(
  '/:taskId',
  [
    auth,
    param('taskId')
      .isInt({ min: 1 })
      .withMessage('任务ID必须是大于0的整数'),
    body('title')
      .optional()
      .notEmpty()
      .withMessage('任务标题不能为空'),
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('截止日期格式无效'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('优先级必须是 low, medium 或 high'),
    body('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'archived'])
      .withMessage('状态必须是 pending, in_progress, completed 或 archived'),
    body('category_ids')
      .optional()
      .isArray()
      .withMessage('分类ID必须是数组'),
    validateRequest
  ],
  updateTask
);

/**
 * @route DELETE /api/tasks/:taskId
 * @desc 删除任务
 * @access Private
 */
router.delete(
  '/:taskId',
  [
    auth,
    param('taskId')
      .isInt({ min: 1 })
      .withMessage('任务ID必须是大于0的整数'),
    validateRequest
  ],
  deleteTask
);

/**
 * @route POST /api/tasks/:taskId/reminders
 * @desc 为任务添加提醒
 * @access Private
 */
router.post(
  '/:taskId/reminders',
  [
    auth,
    param('taskId')
      .isInt({ min: 1 })
      .withMessage('任务ID必须是大于0的整数'),
    body('remind_time')
      .isISO8601()
      .withMessage('提醒时间格式无效'),
    validateRequest
  ],
  createReminder
);

/**
 * @route POST /api/tasks/:taskId/attachments
 * @desc 上传任务附件
 * @access Private
 */
router.post(
  '/:taskId/attachments',
  [
    auth,
    param('taskId')
      .isInt({ min: 1 })
      .withMessage('任务ID必须是大于0的整数'),
    validateRequest
  ],
  upload.single('file'),
  uploadAttachment
);

module.exports = router;