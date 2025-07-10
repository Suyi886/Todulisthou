const { User } = require('../models');

/**
 * 获取当前用户信息
 * @route GET /api/users/me
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 查找用户
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'created_at', 'last_login']
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户信息
 * @route PUT /api/users/me
 */
exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    // 查找用户
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    // 如果更新邮箱，检查邮箱是否已被使用
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({
          error: {
            code: 'DUPLICATE_ENTITY',
            message: '邮箱已被注册'
          }
        });
      }

      // 更新邮箱
      await user.update({ email });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户密码
 * @route PUT /api/users/me/password
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    // 查找用户
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    // 验证当前密码
    const isPasswordValid = await user.validatePassword(current_password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '当前密码不正确'
        }
      });
    }

    // 更新密码
    await user.update({ password: new_password });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};