const { TeamChangeRequest, User, ReportingLine, FinalScore, EvaluationCycle, Sequelize, sequelize } = require('../models');
const catchAsync = require('../utils/catchAsync');

// ==========================================
// TEAM TRANSFERS
// ==========================================
exports.createTransferRequest = catchAsync(async (req, res, next) => {
    const { request_type, target_manager_id } = req.body;

    if (!request_type || !['transfer', 'join_additional'].includes(request_type)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid or missing request_type. Must be "transfer" or "join_additional".' });
    }

    if (!target_manager_id) {
        return res.status(400).json({ status: 'fail', message: 'target_manager_id is required.' });
    }

    const { Op } = require('sequelize');

    const targetManager = await User.findByPk(target_manager_id);
    if (!targetManager || !['manager', 'admin'].includes(targetManager.role)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid target manager.' });
    }

    // req.user does not automatically have managedBy unless included in authenticate middleware
    const currentReportingLine = await ReportingLine.findOne({
        where: {
            employee_id: req.user.id,
            is_active: true
        },
        include: [{ model: User, as: 'manager' }]
    });

    const current_manager_id = currentReportingLine ? currentReportingLine.manager_id : null;


    const existingRequest = await TeamChangeRequest.findOne({
        where: {
            employee_id: req.user.id,
            status: 'pending'
        }
    });

    if (existingRequest) {
        return res.status(400).json({ status: 'fail', message: 'You already have a pending team change request.' });
    }


    const request = await TeamChangeRequest.create({
        employee_id: req.user.id,
        current_manager_id,
        target_manager_id,
        request_type,
        status: 'pending'
    });

    res.status(201).json({ status: 'success', data: { request } });
});

exports.getAllRequests = catchAsync(async (req, res, next) => {
    const whereClause = {};
    const { status } = req.query;


    if (status) {
        whereClause.status = status;
    }

    // If manager, only show requests targeted to them
    // Admin sees all
    if (req.user.role === 'manager') {
        whereClause.target_manager_id = req.user.id;
    }

    const requests = await TeamChangeRequest.findAll({
        where: whereClause,
        include: [
            { model: User, as: 'employee', attributes: ['id', 'full_name', 'email'] },
            { model: User, as: 'currentManager', attributes: ['id', 'full_name'] },
            { model: User, as: 'targetManager', attributes: ['id', 'full_name'] },
        ],
        order: [['created_at', 'DESC']]
    });
    res.status(200).json({ status: 'success', data: { requests } });
});

exports.getMyRequests = catchAsync(async (req, res, next) => {
    const { Op } = require('sequelize');
    const userId = req.user.id;

    // User sees:
    // 1. Requests they created (employee_id)
    // 2. Requests sent TO them (target_manager_id)
    // 3. Requests sent FROM them? (current_manager_id - notifications maybe?)

    // Simplest: Requests where I am the employee OR the target manager
    const requests = await TeamChangeRequest.findAll({
        where: {
            [Op.or]: [
                { employee_id: userId },
                { target_manager_id: userId }
            ]
        },
        include: [
            { model: User, as: 'employee', attributes: ['id', 'full_name', 'email'] },
            { model: User, as: 'currentManager', attributes: ['id', 'full_name'] },
            { model: User, as: 'targetManager', attributes: ['id', 'full_name'] },
        ],
        order: [['created_at', 'DESC']]
    });

    res.status(200).json({ status: 'success', data: { requests } });
});

exports.updateRequestStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body; // approved, rejected

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid status. Must be "approved" or "rejected".' });
    }


    const t = await sequelize.transaction();

    try {
        const request = await TeamChangeRequest.findByPk(id, { transaction: t });

        if (!request) {
            await t.rollback();
            return res.status(404).json({ status: 'fail', message: 'Request not found' });
        }


        if (req.user.role === 'manager' && request.target_manager_id !== req.user.id) {
            await t.rollback();
            return res.status(403).json({ status: 'fail', message: 'You can only manage requests sent to you.' });
        }

        if (request.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ status: 'fail', message: 'Request has already been processed.' });
        }

        if (status === 'approved') {
            // 1. Deactivate old reporting line (ONLY IF TRANSFER)
            if (request.request_type === 'transfer') {
                await ReportingLine.update(
                    { is_active: false, deleted_at: new Date() },
                    {
                        where: {
                            employee_id: request.employee_id,
                            is_active: true
                        },
                        transaction: t
                    }
                );
            }

            // 2. Create new reporting line
            await ReportingLine.create({
                employee_id: request.employee_id,
                manager_id: request.target_manager_id,
                relationship_type: request.request_type === 'transfer' ? 'Primary' : 'Secondary',
                is_active: true
            }, { transaction: t });
        }

        request.status = status;
        await request.save({ transaction: t });

        await t.commit();

        res.status(200).json({ status: 'success', data: { request } });
    } catch (err) {
        await t.rollback();
        // Pass error to global handler
        throw err;
    }
});

// ==========================================
// ANALYTICS
// ==========================================
exports.getUserHistory = catchAsync(async (req, res, next) => {
    const { userId } = req.params;

    const history = await FinalScore.findAll({
        where: { user_id: userId },
        include: [{ model: EvaluationCycle, attributes: ['cycle_name', 'created_at'] }],
        order: [[EvaluationCycle, 'created_at', 'DESC']]
    });
    res.status(200).json({ status: 'success', data: { history } });
});
