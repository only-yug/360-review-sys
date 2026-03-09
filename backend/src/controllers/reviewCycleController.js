const { EvaluationCycle, Review, User, ReportingLine, Sequelize, Skill, Question, QuestionVersion } = require('../models');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllCycles = catchAsync(async (req, res, next) => {
  const cycles = await EvaluationCycle.findAll({
    order: [['created_at', 'DESC']]
  });

  res.status(200).json({ status: 'success', data: { cycles } });
});

exports.getCycleById = catchAsync(async (req, res, next) => {
  const cycle = await EvaluationCycle.findByPk(req.params.id);

  if (!cycle) {
    return next(new AppError('Cycle not found', 404));
  }

  res.status(200).json({ status: 'success', data: { cycle } });
});

const schedulerService = require('../services/schedulerService');

exports.createCycle = catchAsync(async (req, res, next) => {
  const { cycle_name, is_active, start_date, end_date, frequency_months } = req.body;

  if (!cycle_name) {
    return next(new AppError('Cycle name is required', 400));
  }

  // Adjust end_date to be the very end of the day (23:59:59.999) 
  // so that same-day cycles do not immediately trigger as "Closed"
  let adjustedEndDate = end_date;
  if (end_date) {
    const dateObj = new Date(end_date);
    dateObj.setUTCHours(23, 59, 59, 999);
    adjustedEndDate = dateObj;
  }

  const cycle = await EvaluationCycle.create({
    cycle_name,
    is_active: !!is_active,
    start_date,
    end_date: adjustedEndDate,
    frequency_months
  });

  // Auto-Start: Check if this new cycle needs immediate activation
  await schedulerService.activatePendingCycles();


  await cycle.reload();

  res.status(201).json({ status: 'success', data: { cycle } });
});

exports.updateCycle = catchAsync(async (req, res, next) => {
  const cycle = await EvaluationCycle.findByPk(req.params.id);

  if (!cycle) {
    return next(new AppError('Cycle not found', 404));
  }

  await cycle.update(req.body);

  res.status(200).json({ status: 'success', data: { cycle } });
});

exports.startCycle = catchAsync(async (req, res, next) => {
  const t = await User.sequelize.transaction();
  try {
    const cycleId = req.params.id;
    const cycle = await EvaluationCycle.findByPk(cycleId);

    if (!cycle) {
      await t.rollback();
      return next(new AppError('Cycle not found', 404));
    }

    if (cycle.is_active) {
      await t.rollback();
      return next(new AppError('Cycle is already active. Cannot be started again.', 400));
    }

    await cycle.update({ is_active: true }, { transaction: t });


    const reviewService = require('../services/reviewService');
    const count = await reviewService.generateReviewsForCycle(cycle.id, t);

    await t.commit();



    res.status(200).json({ status: 'success', message: `Cycle started, generated ${count} reviews` });

  } catch (err) {
    await t.rollback();
    return next(new AppError(err.message, 500));
  }
});

exports.deleteCycle = catchAsync(async (req, res, next) => {
  const cycle = await EvaluationCycle.findByPk(req.params.id);

  if (!cycle) {
    return next(new AppError('Cycle not found', 404));
  }


  await cycle.destroy();

  res.status(200).json({ status: 'success', message: 'Evaluation cycle deleted' });
});


