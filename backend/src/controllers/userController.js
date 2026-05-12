const { User, ReportingLine } = require('../models');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getMinimalUsers = catchAsync(async (req, res, next) => {
  const { Op } = require('sequelize');
  const users = await User.findAll({
    where: {
      id: { [Op.ne]: req.user.id }
    },
    attributes: ['id', 'full_name', 'role'],
    order: [['full_name', 'ASC']]
  });

  res.status(200).json({ status: 'success', data: { users } });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { Op } = require('sequelize');
  const { page = 1, limit = 10, search, role } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {
    // Exclude the currently logged-in user so admins don't see themselves
    id: { [Op.ne]: req.user.id }
  };
  if (role) {
    whereClause.role = role.toLowerCase();
  }
  if (search) {
    whereClause[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    attributes: ['id', 'full_name', 'email', 'role', 'created_at'],
    include: [
      {
        model: ReportingLine,
        as: 'managedBy',
        where: { is_active: true },
        required: false, // LEFT JOIN
        include: [
          {
            model: User,
            as: 'manager',
            attributes: ['id', 'full_name', 'email']
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']]
  });

  // Formatting the output for the frontend
  const formattedUsers = users.map(user => {
    // Return ALL active managers
    const activeManagers = user.managedBy ? user.managedBy.map(record => ({
      id: record.manager.id,
      name: record.manager.full_name,
      email: record.manager.email
    })) : [];

    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      manager: activeManagers,
      managers: activeManagers
    };
  });

  res.status(200).json({
    status: 'success',
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    },
    data: {
      users: formattedUsers,
    },
  });
});

exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const user = await User.findByPk(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  if (user.role === 'admin' && role && role !== 'admin') {
    return next(new AppError('Cannot modify the role of an Administrator', 403));
  }

  // Check if demoting a Manager/Admin to Employee
  if (role === 'employee' && (user.role === 'manager' || user.role === 'admin')) {
    // Unlink all direct reports - they become "Autonomous"
    // Also soft-delete the relationship record
    await ReportingLine.update(
      { is_active: false, deleted_at: new Date() },
      { where: { manager_id: user.id, is_active: true } }
    );
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.assignManager = catchAsync(async (req, res, next) => {

  const t = await User.sequelize.transaction();

  try {
    const { managerId } = req.body;
    const employeeId = req.params.id;

    // 0a. Validate Employee (Target User)
    const employee = await User.findByPk(employeeId);
    if (!employee) {
      throw new AppError('Employee user not found', 404);
    }
    if (['admin', 'manager'].includes(employee.role)) {
      throw new AppError(`Cannot assign a manager to a ${employee.role === 'admin' ? 'Administrator' : 'Manager'}`, 400);
    }

    // 0b. Validation: Check if manager exists and has correct role
    if (managerId) {
      const managerUser = await User.findByPk(managerId);
      if (!managerUser) {
        throw new AppError('Manager user not found', 404);
      }
      if (!['admin', 'manager'].includes(managerUser.role)) {
        throw new AppError('Selected user does not have Manager privileges (must be Admin or Manager)', 400);
      }
    }

    // 1. Deactivate any existing active reporting line
    await ReportingLine.update(
      { is_active: false },
      { where: { employee_id: employeeId, is_active: true }, transaction: t }
    );

    // 2. Create new reporting line if managerId is provided
    if (managerId) {
      await ReportingLine.create(
        {
          employee_id: employeeId,
          manager_id: managerId,
          is_active: true
        },
        { transaction: t }
      );
    }

    await t.commit();

    res.status(200).json({
      status: 'success',
      message: 'Manager assigned successfully'
    });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
});

// Add ONE manager without removing existing ones (many-to-many append)
exports.addManager = catchAsync(async (req, res, next) => {
  const t = await User.sequelize.transaction();
  try {
    const { managerId } = req.body;
    const employeeId = req.params.id;

    if (!managerId) throw new AppError('managerId is required', 400);

    const employee = await User.findByPk(employeeId);
    if (!employee) throw new AppError('Employee not found', 404);
    if (['admin', 'manager'].includes(employee.role)) {
      throw new AppError(`Cannot assign a manager to a ${employee.role === 'admin' ? 'Administrator' : 'Manager'}`, 400);
    }

    const managerUser = await User.findByPk(managerId);
    if (!managerUser) throw new AppError('Manager not found', 404);
    if (!['admin', 'manager'].includes(managerUser.role)) {
      throw new AppError('Selected user does not have Manager privileges', 400);
    }

    // Prevent duplicate active lines for the same pair
    const existing = await ReportingLine.findOne({
      where: { employee_id: employeeId, manager_id: managerId, is_active: true }
    });
    if (existing) {
      await t.rollback();
      return res.status(200).json({ status: 'success', message: 'Manager already assigned' });
    }

    await ReportingLine.create(
      { employee_id: employeeId, manager_id: managerId, is_active: true },
      { transaction: t }
    );

    await t.commit();
    res.status(200).json({ status: 'success', message: 'Manager added successfully' });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
});

// Remove ONE specific manager (soft-delete that single line)
exports.removeManager = catchAsync(async (req, res, next) => {
  const t = await User.sequelize.transaction();
  try {
    const { employeeId, managerId } = req.params;

    const line = await ReportingLine.findOne({
      where: { employee_id: employeeId, manager_id: managerId, is_active: true }
    });

    if (!line) {
      await t.rollback();
      return res.status(404).json({ status: 'fail', message: 'Reporting line not found' });
    }

    await line.update({ is_active: false, deleted_at: new Date() }, { transaction: t });

    await t.commit();
    res.status(200).json({ status: 'success', message: 'Manager removed successfully' });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
});

exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password_hash'] },
    include: [{
      model: ReportingLine,
      as: 'managedBy',
      where: { is_active: true },
      required: false,
      include: [{ model: User, as: 'manager', attributes: ['id', 'full_name'] }]
    }]
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({ status: 'success', data: { user } });
});


exports.createUser = catchAsync(async (req, res, next) => {
  const t = await User.sequelize.transaction();

  try {
    const { full_name, email, password, role, managerId, managerIds } = req.body;

    // Normalize to an array of manager IDs (supports both single and multi)
    let resolvedManagerIds = [];
    if (managerIds && Array.isArray(managerIds) && managerIds.length > 0) {
      resolvedManagerIds = managerIds.filter(Boolean);
    } else if (managerId) {
      resolvedManagerIds = [managerId];
    }

    // 1. Validation
    const existingUser = await User.findOne({ where: { email }, paranoid: false });
    
    let isRestore = false;
    if (existingUser) {
      if (existingUser.deleted_at) {
        // User was deleted previously, allow admin to recreate them by restoring the account
        isRestore = true;
      } else {
        throw new AppError('User already exists', 400);
      }
    }

    if (role === 'admin') {
      throw new AppError('Cannot create a new Administrator via API', 400);
    }

    if (['admin', 'manager'].includes(role) && resolvedManagerIds.length > 0) {
      throw new AppError(`Cannot assign a manager to a ${role === 'admin' ? 'Administrator' : 'Manager'}`, 400);
    }

    // Validate all manager IDs
    for (const mId of resolvedManagerIds) {
      const managerUser = await User.findByPk(mId);
      if (!managerUser) {
        throw new AppError(`Manager user not found (ID: ${mId})`, 404);
      }
      if (!['admin', 'manager'].includes(managerUser.role)) {
        throw new AppError(`User "${managerUser.full_name}" does not have Manager privileges`, 400);
      }
    }

    // 2. Create or Restore User
    if (!password) {
      throw new AppError('Password is required', 400);
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    let newUser;
    if (isRestore) {
      await existingUser.restore({ transaction: t });
      await existingUser.update({
        full_name,
        password_hash: hashedPassword,
        role: role || 'employee',
      }, { transaction: t });
      newUser = existingUser;
    } else {
      newUser = await User.create({
        full_name,
        email,
        password_hash: hashedPassword,
        role: role || 'employee',
      }, { transaction: t });
    }

    // 3. Assign Managers
    for (const mId of resolvedManagerIds) {
      await ReportingLine.create({
        employee_id: newUser.id,
        manager_id: mId,
        is_active: true
      }, { transaction: t });
    }

    await t.commit();

    // Prepare response (exclude password)
    const userObj = newUser.toJSON();
    if (resolvedManagerIds.length > 0) {
      userObj.managerIds = resolvedManagerIds;
    }

    res.status(201).json({
      status: 'success',
      data: {
        user: userObj,
      },
    });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const t = await User.sequelize.transaction();
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      await t.rollback();
      return next(new AppError('User not found', 404));
    }

    if (user.role === 'admin') {
      await t.rollback();
      return next(new AppError('Cannot delete the Administrator account', 403));
    }

    const now = new Date();

    // 1. Downstream: Deactivate and soft-delete lines where this user is the MANAGER
    // Their direct reports become "Autonomous"
    await ReportingLine.update(
      { is_active: false, deleted_at: now },
      { where: { manager_id: user.id, is_active: true }, transaction: t }
    );

    // 2. Upstream: Deactivate and soft-delete line where this user is the EMPLOYEE
    // Their connection to their own manager is severed
    await ReportingLine.update(
      { is_active: false, deleted_at: now },
      { where: { employee_id: user.id, is_active: true }, transaction: t }
    );

    await user.destroy({ transaction: t });
    await t.commit();
    res.status(200).json({ status: 'success', message: 'User deleted' });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
});

exports.updateUser = catchAsync(async (req, res, next) => {
  // Admin update user details
  const { full_name, email, role } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.role === 'admin' && role && role !== 'admin') {
    return next(new AppError('Cannot modify the role of an Administrator', 403));
  }

  // Check if demoting a Manager/Admin to Employee
  if (role && role === 'employee' && (user.role === 'manager' || user.role === 'admin')) {
    // Unlink all direct reports and soft-delete
    await ReportingLine.update(
      { is_active: false, deleted_at: new Date() },
      { where: { manager_id: user.id, is_active: true } }
    );
  }

  if (full_name) user.full_name = full_name;
  if (email) user.email = email;
  if (role) user.role = role;

  await user.save();
  res.status(200).json({ status: 'success', data: { user } });
});

exports.getMyTeam = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: myTeamLines } = await ReportingLine.findAndCountAll({
    where: { manager_id: req.user.id, is_active: true },
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [{
      model: User,
      as: 'employee',
      attributes: ['id', 'full_name', 'email', 'role', 'created_at']
    }],
    order: [['created_at', 'DESC']]
  });

  const teamMembers = myTeamLines.map(line => line.employee);

  res.status(200).json({
    status: 'success',
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    },
    data: { team: teamMembers }
  });
});

exports.getMyManager = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: myManagerLines } = await ReportingLine.findAndCountAll({
    where: { employee_id: req.user.id, is_active: true },
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [{
      model: User,
      as: 'manager',
      attributes: ['id', 'full_name', 'email', 'role', 'created_at']
    }],
    order: [['created_at', 'DESC']]
  });

  const managers = myManagerLines.map(line => line.manager);

  res.status(200).json({
    status: 'success',
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    },
    data: { managers }
  });
});
