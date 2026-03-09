const { FinalScore, UserSkillScore, User, Skill, EvaluationCycle, ReportingLine, Sequelize } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getTopOverallOrder = catchAsync(async (req, res, next) => {
    const limit = parseInt(req.query.limit, 10) || 3;
    const yearStr = req.query.year;

    // Default to current year if not provided
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

    // PostgreSQL/MySQL require correct casting or dialect specific date functions,
    // but a safe universal Sequelize method is to use Op.between
    const { Op } = Sequelize;
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Fetch aggregated scores for cycles within the year
    const topScoresData = await FinalScore.findAll({
        attributes: [
            'user_id',
            [Sequelize.fn('AVG', Sequelize.col('final_score')), 'avg_score']
        ],
        include: [
            {
                model: User,
                attributes: ['id', 'full_name', 'email', 'role'],
                required: true
            },
            {
                model: EvaluationCycle,
                attributes: [], // Don't fetch cycle details in group by
                where: {
                    end_date: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                required: true // INNER JOIN to ensure only scores for these cycles are included
            }
        ],
        group: ['user_id', 'User.id'],
        order: [[Sequelize.literal('avg_score'), 'DESC']],
        limit: limit
    });

    // Format to match existing payload structure expected by frontend
    const topScores = topScoresData.map(score => ({
        final_score: parseFloat(score.getDataValue('avg_score')).toFixed(2),
        User: score.User,
        EvaluationCycle: { cycle_name: `Year ${year} Average` } // Mock cycle name for frontend display
    }));

    res.status(200).json({
        status: 'success',
        results: topScores.length,
        data: {
            topScores
        }
    });
});

exports.getTopSkillScorers = catchAsync(async (req, res, next) => {
    const yearStr = req.query.year;
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

    const { Op } = Sequelize;
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Fetch active skills
    const skills = await Skill.findAll({
        where: { is_active: true }
    });

    const topSkillScorers = [];

    for (const skill of skills) {
        const topScorerData = await UserSkillScore.findAll({
            attributes: [
                'user_id',
                [Sequelize.fn('AVG', Sequelize.col('score_obtained')), 'avg_score']
            ],
            where: {
                skill_id: skill.id
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'full_name', 'email'],
                    required: true
                },
                {
                    model: EvaluationCycle,
                    attributes: [],
                    where: {
                        end_date: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    required: true
                }
            ],
            group: ['user_id', 'User.id'],
            order: [[Sequelize.literal('avg_score'), 'DESC']],
            limit: 1 // Only need the top 1 per skill
        });

        if (topScorerData && topScorerData.length > 0) {
            const topScorer = topScorerData[0];
            topSkillScorers.push({
                skill: {
                    id: skill.id,
                    name: skill.skill_name,
                    category: skill.category
                },
                user: topScorer.User,
                score: parseFloat(topScorer.getDataValue('avg_score')).toFixed(2)
            });
        }
    }

    res.status(200).json({
        status: 'success',
        results: topSkillScorers.length,
        data: {
            topSkillScorers
        }
    });
});

exports.getScoreHistory = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const { filter, skill_id } = req.query;

    // 1. Determine Target User (Specific User or Current User)
    let targetUserId = userId === 'all' || !userId ? req.user.id : userId;

    // Security Check: Role-Based Access Control
    // Security Check: Role-Based Access Control
    // 1. Manager: Can see their own data OR data of their direct reports.
    if (req.user.role === 'manager') {
        if (targetUserId.toString() !== req.user.id.toString()) {
            const isManaged = await ReportingLine.findOne({
                where: {
                    manager_id: req.user.id,
                    employee_id: targetUserId
                }
            });
            if (!isManaged) {
                return next(new AppError('You are not authorized to view this user\'s history', 403));
            }
        }
    }
    // 2. Employee: Can ONLY see their own data. (Admin is implicitly allowed if we skip this)
    else if (req.user.role !== 'admin') {
        if (targetUserId.toString() !== req.user.id.toString()) {
            return next(new AppError('You are not authorized to view this user\'s history', 403));
        }
    }

    const { Op } = Sequelize;

    // 2. Date Filter
    let dateFilter = {};
    if (filter && filter !== 'all') {
        const now = new Date();
        let pastDate = new Date(now);
        switch (filter) {
            case '1m': pastDate.setMonth(now.getMonth() - 1); break;
            case '3m': pastDate.setMonth(now.getMonth() - 3); break;
            case '6m': pastDate.setMonth(now.getMonth() - 6); break;
            case '1y': pastDate.setFullYear(now.getFullYear() - 1); break;
            case 'max': pastDate = null; break;
            default: pastDate = null;
        }

        if (pastDate) {
            dateFilter = {
                end_date: { [Op.gte]: pastDate }
            };
        }

    }

    let historyData = [];

    // 3. Query Logic
    if (skill_id) {
        // --- Scenario A: Skill-Specific History (UserSkillScore) ---

        const whereClause = {
            user_id: targetUserId,
            skill_id: skill_id
        };

        historyData = await UserSkillScore.findAll({
            where: whereClause,
            include: [{
                model: EvaluationCycle,
                attributes: ['cycle_name', 'end_date'],
                where: dateFilter
            }],
            order: [[EvaluationCycle, 'end_date', 'ASC']]
        });

        // Map to standardized format
        historyData = historyData.map(item => ({
            period: item.EvaluationCycle ? item.EvaluationCycle.cycle_name : 'Unknown',
            score: parseFloat(item.score_obtained || 0)
        }));

    } else {
        // --- Scenario B: Overall Score History (FinalScore) ---

        const whereClause = {
            user_id: targetUserId
        };

        historyData = await FinalScore.findAll({
            where: whereClause,
            include: [{
                model: EvaluationCycle,
                attributes: ['cycle_name', 'end_date'],
                where: dateFilter
            }],
            order: [[EvaluationCycle, 'end_date', 'ASC']]
        });

        // Map to standardized format
        historyData = historyData.map(item => ({
            period: item.EvaluationCycle ? item.EvaluationCycle.cycle_name : 'Unknown',
            score: parseFloat(item.final_score || 0)
        }));
    }

    res.status(200).json({
        status: 'success',
        results: historyData.length,
        data: {
            history: historyData
        }
    });
});

exports.getLatestSkillDistribution = catchAsync(async (req, res, next) => {
    const { userId } = req.params;

    // 1. Determine Target User (Same logic as History)
    let targetUserId = userId === 'all' || !userId ? req.user.id : userId;

    // 2. RBAC Security Check (Same logic as History)
    // 2. RBAC Security Check (Same logic as History)
    if (req.user.role === 'manager') {
        if (targetUserId.toString() !== req.user.id.toString()) {
            const isManaged = await ReportingLine.findOne({
                where: { manager_id: req.user.id, employee_id: targetUserId, is_active: true }
            });
            if (!isManaged) return next(new AppError('You are not authorized to view this user\'s data', 403));
        }
    }
    else if (req.user.role !== 'admin') {
        if (targetUserId.toString() !== req.user.id.toString()) {
            return next(new AppError('You are not authorized to view this user\'s data', 403));
        }
    }


    let targetCycleId = req.query.cycle_id;
    let cycleName = 'Custom';

    if (!targetCycleId) {
        // Find the most recent Cycle for this user
        const latestScoreEntry = await UserSkillScore.findOne({
            where: { user_id: targetUserId },
            order: [['created_at', 'DESC']],
            include: [{ model: EvaluationCycle, attributes: ['id', 'cycle_name'] }]
        });

        if (!latestScoreEntry) {
            return res.status(200).json({
                status: 'success',
                data: { distribution: [], cycle: null }
            });
        }
        targetCycleId = latestScoreEntry.cycle_id;
        cycleName = latestScoreEntry.EvaluationCycle ? latestScoreEntry.EvaluationCycle.cycle_name : 'Latest';
    } else {
        const cycle = await EvaluationCycle.findByPk(targetCycleId);
        if (cycle) cycleName = cycle.cycle_name;
    }


    const skillsData = await UserSkillScore.findAll({
        where: {
            user_id: targetUserId,
            cycle_id: targetCycleId
        },
        include: [{
            model: Skill,
            attributes: ['id', 'skill_name', 'category']
        }]
    });

    // 5. Format for Frontend Spider Graph
    const distribution = skillsData.map(item => ({
        skill: item.Skill ? item.Skill.skill_name : 'Unknown',
        score: parseFloat(item.score_obtained || 0),
        fullMark: 10,
        category: item.Skill ? item.Skill.category : 'General'
    }));

    res.status(200).json({
        status: 'success',
        results: distribution.length,
        data: {
            distribution,
            cycle: {
                id: targetCycleId,
                name: cycleName
            }
        }
    });
});
