const express = require('express');
const router = express.Router();
const { deleteAttachment } = require('../controllers/attachment.controller');
const auth = require('../middleware/auth');
const { param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @route DELETE /api/attachments/:attachmentId
 * @desc 删除附件
 * @access Private
 */
router.delete(
  '/:attachmentId',
  [
    auth,
    param('attachmentId')
      .isInt({ min: 1 })
      .withMessage('附件ID必须是大于0的整数'),
    validateRequest
  ],
  deleteAttachment
);

module.exports = router;