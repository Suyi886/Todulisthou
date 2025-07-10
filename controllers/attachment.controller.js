const path = require('path');
const fs = require('fs');
const { Attachment, Task } = require('../models');

/**
 * 上传任务附件
 * @route POST /api/tasks/:taskId/attachments
 */
exports.uploadAttachment = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: '未提供文件'
        }
      });
    }

    // 验证任务是否存在且属于当前用户
    const task = await Task.findOne({
      where: {
        id: taskId,
        user_id: userId
      }
    });

    if (!task) {
      // 删除上传的文件
      fs.unlinkSync(file.path);
      
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '任务不存在'
        }
      });
    }

    // 创建附件记录
    const fileUrl = `/uploads/${path.basename(file.path)}`;
    const attachment = await Attachment.create({
      task_id: taskId,
      filename: file.originalname,
      filetype: file.mimetype,
      filesize: file.size,
      file_url: fileUrl,
      upload_time: new Date()
    });

    res.status(201).json({
      id: attachment.id,
      task_id: attachment.task_id,
      filename: attachment.filename,
      filetype: attachment.filetype,
      filesize: attachment.filesize,
      upload_time: attachment.upload_time,
      file_url: attachment.file_url
    });
  } catch (error) {
    // 如果上传过程中出错，删除已上传的文件
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * 删除附件
 * @route DELETE /api/attachments/:attachmentId
 */
exports.deleteAttachment = async (req, res, next) => {
  try {
    const attachmentId = req.params.attachmentId;
    const userId = req.user.id;

    // 查找附件并验证所属任务是否属于当前用户
    const attachment = await Attachment.findByPk(attachmentId, {
      include: [{
        model: Task,
        as: 'task',
        where: { user_id: userId }
      }]
    });

    if (!attachment) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '附件不存在或无权访问'
        }
      });
    }

    // 删除文件
    const filePath = path.join(__dirname, '..', attachment.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除附件记录
    await attachment.destroy();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};