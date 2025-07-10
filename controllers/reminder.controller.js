const { Reminder, Task } = require('../models');

/**
 * 为任务添加提醒
 * @route POST /api/tasks/:taskId/reminders
 */
exports.createReminder = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;
    const { remind_time } = req.body;

    // 验证任务是否存在且属于当前用户
    const task = await Task.findOne({
      where: {
        id: taskId,
        user_id: userId
      }
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '任务不存在'
        }
      });
    }

    // 创建提醒
    const reminder = await Reminder.create({
      task_id: taskId,
      remind_time
    });

    res.status(201).json({
      id: reminder.id,
      task_id: reminder.task_id,
      remind_time: reminder.remind_time,
      reminded: reminder.reminded
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新提醒时间
 * @route PUT /api/reminders/:reminderId
 */
exports.updateReminder = async (req, res, next) => {
  try {
    const reminderId = req.params.reminderId;
    const userId = req.user.id;
    const { remind_time } = req.body;

    // 查找提醒并验证所属任务是否属于当前用户
    const reminder = await Reminder.findByPk(reminderId, {
      include: [{
        model: Task,
        as: 'task',
        where: { user_id: userId }
      }]
    });

    if (!reminder) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '提醒不存在或无权访问'
        }
      });
    }

    // 更新提醒时间
    await reminder.update({ remind_time });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * 删除提醒
 * @route DELETE /api/reminders/:reminderId
 */
exports.deleteReminder = async (req, res, next) => {
  try {
    const reminderId = req.params.reminderId;
    const userId = req.user.id;

    // 查找提醒并验证所属任务是否属于当前用户
    const reminder = await Reminder.findByPk(reminderId, {
      include: [{
        model: Task,
        as: 'task',
        where: { user_id: userId }
      }]
    });

    if (!reminder) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '提醒不存在或无权访问'
        }
      });
    }

    // 删除提醒
    await reminder.destroy();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};