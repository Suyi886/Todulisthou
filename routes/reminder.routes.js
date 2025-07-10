const express = require('express');
const router = express.Router();
const { updateReminder, deleteReminder } = require('../controllers/reminder.controller');
const auth = require('../middleware/auth');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @route PUT /api/reminders/:reminderId
 * @desc 更新提醒时间
 * @access Private
 */
router.put(
  '/:reminderId',
  [
    auth,
    param('reminderId')
      .isInt({ min: 1 })
      .withMessage('提醒ID必须是大于0的整数'),
    body('remind_time')
      .isISO8601()
      .withMessage('提醒时间格式无效'),
    validateRequest
  ],
  updateReminder
);

/**
 * @route DELETE /api/reminders/:reminderId
 * @desc 删除提醒
 * @access Private
 */
router.delete(
  '/:reminderId',
  [
    auth,
    param('reminderId')
      .isInt({ min: 1 })
      .withMessage('提醒ID必须是大于0的整数'),
    validateRequest
  ],
  deleteReminder
);

module.exports = router;