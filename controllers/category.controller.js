const { Op } = require('sequelize');
const { Category, TaskCategory } = require('../models');
const { sequelize } = require('../config/db');

/**
 * 创建分类
 * @route POST /api/categories
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const userId = req.user.id;

    // 检查分类名称是否已存在
    const existingCategory = await Category.findOne({
      where: {
        name,
        user_id: userId
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_ENTITY',
          message: '分类名称已存在'
        }
      });
    }

    // 创建分类
    const category = await Category.create({
      name,
      color,
      user_id: userId
    });

    res.status(201).json({
      id: category.id,
      name: category.name,
      color: category.color,
      user_id: category.user_id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户分类列表
 * @route GET /api/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 查询用户的所有分类
    const categories = await Category.findAll({
      where: { user_id: userId },
      order: [['name', 'ASC']]
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新分类
 * @route PUT /api/categories/:categoryId
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.categoryId;
    const userId = req.user.id;
    const { name, color } = req.body;

    // 查找分类
    const category = await Category.findOne({
      where: {
        id: categoryId,
        user_id: userId
      }
    });

    if (!category) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '分类不存在'
        }
      });
    }

    // 如果更新名称，检查名称是否已存在
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: {
          name,
          user_id: userId,
          id: { [Op.ne]: categoryId }
        }
      });

      if (existingCategory) {
        return res.status(409).json({
          error: {
            code: 'DUPLICATE_ENTITY',
            message: '分类名称已存在'
          }
        });
      }
    }

    // 更新分类
    await category.update({
      name: name || category.name,
      color: color || category.color
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * 删除分类
 * @route DELETE /api/categories/:categoryId
 */
exports.deleteCategory = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const categoryId = req.params.categoryId;
    const userId = req.user.id;

    // 查找分类
    const category = await Category.findOne({
      where: {
        id: categoryId,
        user_id: userId
      }
    });

    if (!category) {
      await transaction.rollback();
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '分类不存在'
        }
      });
    }

    // 删除任务分类关联
    await TaskCategory.destroy({
      where: { category_id: categoryId },
      transaction
    });

    // 删除分类
    await category.destroy({ transaction });

    await transaction.commit();
    res.status(204).send();
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};