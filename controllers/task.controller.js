const { Op } = require('sequelize');
const { Task, Category, Reminder, Attachment, TaskCategory } = require('../models');
const { sequelize } = require('../config/db');

/**
 * 创建任务
 * @route POST /api/tasks
 */
exports.createTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { title, description, due_date, priority, status, category_ids } = req.body;
    const userId = req.user.id;

    // 创建任务
    const task = await Task.create({
      title,
      description,
      due_date,
      priority,
      status,
      user_id: userId
    }, { transaction });

    // 如果提供了分类ID，添加任务分类关联
    if (category_ids && category_ids.length > 0) {
      // 验证分类是否存在且属于当前用户
      const categories = await Category.findAll({
        where: {
          id: category_ids,
          user_id: userId
        }
      });

      // 创建任务分类关联
      if (categories.length > 0) {
        await Promise.all(
          categories.map(category => 
            TaskCategory.create({
              task_id: task.id,
              category_id: category.id
            }, { transaction })
          )
        );
      }
    }

    await transaction.commit();

    // 获取包含分类的完整任务信息
    const createdTask = await Task.findByPk(task.id, {
      include: [{
        model: Category,
        as: 'categories',
        attributes: ['id', 'name']
      }]
    });

    res.status(201).json({
      id: createdTask.id,
      title: createdTask.title,
      description: createdTask.description,
      created_at: createdTask.created_at,
      updated_at: createdTask.updated_at,
      due_date: createdTask.due_date,
      priority: createdTask.priority,
      status: createdTask.status,
      user_id: createdTask.user_id,
      categories: createdTask.categories.map(category => ({
        id: category.id,
        name: category.name
      }))
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * 获取任务列表（带筛选）
 * @route GET /api/tasks
 */
exports.getTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      status,
      priority,
      due_date_after,
      due_date_before,
      search,
      category_id,
      page = 1,
      limit = 10
    } = req.query;

    // 构建查询条件
    const where = { user_id: userId };
    const include = [];

    // 状态筛选
    if (status) {
      where.status = status;
    }

    // 优先级筛选
    if (priority) {
      where.priority = priority;
    }

    // 截止日期筛选
    if (due_date_after || due_date_before) {
      where.due_date = {};
      if (due_date_after) {
        where.due_date[Op.gte] = new Date(due_date_after);
      }
      if (due_date_before) {
        where.due_date[Op.lte] = new Date(due_date_before);
      }
    }

    // 标题搜索
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // 分类筛选
    if (category_id) {
      include.push({
        model: Category,
        as: 'categories',
        where: { id: category_id },
        attributes: ['id', 'name']
      });
    } else {
      include.push({
        model: Category,
        as: 'categories',
        attributes: ['id', 'name']
      });
    }

    // 分页
    const offset = (page - 1) * limit;

    // 查询任务
    const { count, rows } = await Task.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['due_date', 'ASC'], ['created_at', 'DESC']],
      distinct: true
    });

    // 格式化响应
    const tasks = rows.map(task => ({
      id: task.id,
      title: task.title,
      due_date: task.due_date,
      priority: task.priority,
      status: task.status,
      categories: task.categories.map(category => category.name)
    }));

    res.json({
      data: tasks,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取单个任务详情
 * @route GET /api/tasks/:taskId
 */
exports.getTaskById = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;

    // 查询任务详情
    const task = await Task.findOne({
      where: {
        id: taskId,
        user_id: userId
      },
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name', 'color']
        },
        {
          model: Reminder,
          as: 'reminders',
          attributes: ['id', 'remind_time', 'reminded']
        },
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'filename', 'filetype', 'filesize', 'file_url', 'upload_time']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '任务不存在'
        }
      });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新任务
 * @route PUT /api/tasks/:taskId
 */
exports.updateTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;
    const { title, description, due_date, status, priority, category_ids } = req.body;

    // 查找任务
    const task = await Task.findOne({
      where: {
        id: taskId,
        user_id: userId
      }
    });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '任务不存在'
        }
      });
    }

    // 更新任务基本信息
    await task.update({
      title,
      description,
      due_date,
      status,
      priority
    }, { transaction });

    // 如果提供了分类ID，更新任务分类关联
    if (category_ids) {
      // 删除现有关联
      await TaskCategory.destroy({
        where: { task_id: taskId },
        transaction
      });

      // 验证分类是否存在且属于当前用户
      const categories = await Category.findAll({
        where: {
          id: category_ids,
          user_id: userId
        }
      });

      // 创建新的任务分类关联
      if (categories.length > 0) {
        await Promise.all(
          categories.map(category => 
            TaskCategory.create({
              task_id: task.id,
              category_id: category.id
            }, { transaction })
          )
        );
      }
    }

    await transaction.commit();
    res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * 删除任务
 * @route DELETE /api/tasks/:taskId
 */
exports.deleteTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;

    // 查找任务
    const task = await Task.findOne({
      where: {
        id: taskId,
        user_id: userId
      }
    });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '任务不存在'
        }
      });
    }

    // 删除任务相关的所有数据
    // 1. 删除任务分类关联
    await TaskCategory.destroy({
      where: { task_id: taskId },
      transaction
    });

    // 2. 删除任务提醒
    await Reminder.destroy({
      where: { task_id: taskId },
      transaction
    });

    // 3. 删除任务附件
    await Attachment.destroy({
      where: { task_id: taskId },
      transaction
    });

    // 4. 删除任务
    await task.destroy({ transaction });

    await transaction.commit();
    res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};