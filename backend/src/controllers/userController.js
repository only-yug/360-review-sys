const { User, ReportingLine } = require('../models');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
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
    order: [['id', 'ASC']]
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
          relationship_type: 'Primary',
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
    const { full_name, email, password, role, managerId } = req.body;

    // 1. Validation
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    if (role === 'admin') {
      throw new AppError('Cannot create a new Administrator via API', 400);
    }

    if (['admin', 'manager'].includes(role) && managerId) {
      throw new AppError(`Cannot assign a manager to a ${role === 'admin' ? 'Administrator' : 'Manager'}`, 400);
    }

    if (managerId) {
      const managerUser = await User.findByPk(managerId);
      if (!managerUser) {
        throw new AppError('Manager user not found', 404);
      }
      if (!['admin', 'manager'].includes(managerUser.role)) {
        throw new AppError('Selected user does not have Manager privileges', 400);
      }
    }

    // 2. Create User
    // Default password if not provided
    if (!password) {
      throw new AppError('Password is required', 400);
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      full_name,
      email,
      password_hash: hashedPassword,
      role: role || 'employee',
    }, { transaction: t });

    // 3. Assign Manager (if provided)
    if (managerId) {
      await ReportingLine.create({
        employee_id: newUser.id,
        manager_id: managerId,
        relationship_type: 'Primary',
        is_active: true
      }, { transaction: t });
    }

    await t.commit();

    // Prepare response (exclude password)
    const userObj = newUser.toJSON();
    if (managerId) {
      userObj.manager = { id: managerId };
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
  // Get users where I am the manager (Primary)
  // We need to join ReportingLine where manager_id = req.user.id AND is_active = true
  // Then get the Employee details

  const myTeamLines = await ReportingLine.findAll({
    where: { manager_id: req.user.id, is_active: true },
    include: [{
      model: User,
      as: 'employee',
      attributes: ['id', 'full_name', 'email', 'role']
    }]
  });

  const teamMembers = myTeamLines.map(line => line.employee);

  res.status(200).json({
    status: 'success',
    data: { team: teamMembers }
  });
});

exports.getMyManager = catchAsync(async (req, res, next) => {
  // Get my active managers
  const myManagerLines = await ReportingLine.findAll({
    where: { employee_id: req.user.id, is_active: true },
    include: [{
      model: User,
      as: 'manager',
      attributes: ['id', 'full_name', 'email', 'role']
    }]
  });

  const managers = myManagerLines.map(line => line.manager);

  res.status(200).json({
    status: 'success',
    data: { managers }
  });
});
