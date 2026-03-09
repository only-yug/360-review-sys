const { generateToken, generateRefreshToken, verifyToken, verifyRefreshToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const createSendToken = (user, statusCode, res) => {
  const token = generateToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  // Remove password from output
  const userObj = user.toJSON();

  res.status(statusCode).json({
    status: 'success',
    data: {
      user: userObj,
      token,
      refreshToken,
    },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { full_name, email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('User already exists', 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await User.create({
    full_name,
    email,
    password_hash: hashedPassword,
    role: 'employee', // Default role
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;


  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }


  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }


  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {

  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }


  const decoded = verifyToken(token);

  if (!decoded) {
    return next(new AppError('Invalid token or session expired.', 401));
  }


  const currentUser = await User.findByPk(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'manager']. role='employee'
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};


exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  const decoded = verifyRefreshToken(refreshToken);

  if (!decoded) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  const currentUser = await User.findByPk(decoded.id);

  if (!currentUser) {
    return next(new AppError('User no longer exists', 401));
  }

  const newToken = generateToken({ id: currentUser.id, role: currentUser.role });
  const newRefreshToken = generateRefreshToken({ id: currentUser.id });

  res.status(200).json({
    status: 'success',
    data: {
      token: newToken,
      refreshToken: newRefreshToken
    }
  });
});

exports.getProfile = catchAsync(async (req, res, next) => {
  const userObj = req.user.toJSON();
  res.status(200).json({ status: 'success', data: { user: userObj } });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const { full_name } = req.body;
  if (full_name) {
    req.user.full_name = full_name;
    await req.user.save();
  }

  // Remove password from output
  const userObj = req.user.toJSON();

  res.status(200).json({ status: 'success', data: { user: userObj } });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const isMatch = await req.user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password wrong', 401));
  }

  req.user.password_hash = await bcrypt.hash(newPassword, 12);
  await req.user.save();

  createSendToken(req.user, 200, res);
});
