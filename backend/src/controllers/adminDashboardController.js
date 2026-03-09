const {
    EvaluationCycle,
    User,
    Review,
    ReviewAnswer,
    ReviewSkillFeedback,
    Skill,
    UserSkillScore,
    FinalScore,
    sequelize
} = require('../models');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

// Helper: Recalculate UserSkillScore
const recalculateUserSkillScore = async (userId, skillId, cycleId, transaction) => {
    // 1. Fetch scores directly via aggregation

    const feedbacks = await ReviewSkillFeedback.findAll({
        where: {
            skill_id: skillId
        },
        include: [{
            model: Review,
            attributes: ['id'],
            where: {
                reviewee_id: userId,
                cycle_id: cycleId,
                status: 'completed'
            },
            required: true
        }],
        transaction
    });

    if (feedbacks.length === 0) return;

    // Collect Review IDs where we might need answers (no override)
    const pendingReviewIds = feedbacks
        .filter(fb => fb.score_override === null)
        .map(fb => fb.review_id);

    // Bulk fetch answers for these reviews + skill
    let answersMap = {};
    if (pendingReviewIds.length > 0) {
        const answers = await ReviewAnswer.findAll({
            where: { review_id: pendingReviewIds },
            include: [{
                model: sequelize.models.QuestionVersion,
                as: 'questionVersion',
                required: true,
                include: [{
                    model: sequelize.models.Question,
                    as: 'question',
                    where: { skill_id: skillId },
                    required: true
                }]
            }],
            transaction
        });

        // Group by review_id
        answers.forEach(a => {
            if (!answersMap[a.review_id]) answersMap[a.review_id] = [];
            answersMap[a.review_id].push(parseFloat(a.score_value));
        });
    }

    let totalScore = 0;
    let count = 0;

    for (const fb of feedbacks) {
        let score = 0;
        if (fb.score_override !== null) {
            score = parseFloat(fb.score_override);
            totalScore += score;
            count++;
        } else {
            const vals = answersMap[fb.review_id] || [];
            if (vals.length > 0) {
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                totalScore += avg;
                count++;
            }
        }
    }

    const finalScore = count > 0 ? (totalScore / count).toFixed(2) : 0;

    // 3. Update or Create UserSkillScore
    const [scoreRecord, created] = await UserSkillScore.findOrCreate({
        where: {
            user_id: userId,
            skill_id: skillId,
            cycle_id: cycleId
        },
        defaults: {
            score_obtained: finalScore,
            weighted_score: finalScore,
            skill_weight_snapshot: 1.0
        },
        transaction
    });

    if (!created) {
        scoreRecord.score_obtained = finalScore;
        scoreRecord.weighted_score = finalScore;
        await scoreRecord.save({ transaction });
    }
};

exports.getCycles = catchAsync(async (req, res) => {
    const cycles = await EvaluationCycle.findAll({
        order: [['created_at', 'DESC']],
        attributes: ['id', ['cycle_name', 'label'], 'is_active', 'start_date', 'end_date']
    });

    const formatted = cycles.map(c => ({
        id: c.id,
        label: c.getDataValue('label'),
        status: c.is_active ? 'active' : 'closed',
        startDate: c.start_date,
        endDate: c.end_date
    }));

    res.status(200).json(formatted);
});

exports.getDashboardEmployees = catchAsync(async (req, res) => {
    const { cycleId, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
        role: { [Op.ne]: 'admin' }
    };

    if (search) {
        whereClause[Op.or] = [
            { full_name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
        ];
    }


    const { count, rows: employees } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: ['id', ['full_name', 'name'], 'role', 'email'],
        order: [['full_name', 'ASC']]
    });

    const employeeIds = employees.map(e => e.id);

    if (employeeIds.length > 0) {
        // Bulk fetch stats using aggregation
        const [
            reviewsReceived,
            totalReviewsExpected,
            reviewsWritten,
            totalReviewsToWrite
        ] = await Promise.all([
            Review.findAll({
                where: {
                    reviewee_id: employeeIds,
                    cycle_id: cycleId,
                    status: 'completed'
                },
                attributes: ['reviewee_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                group: ['reviewee_id'],
                raw: true
            }),
            Review.findAll({
                where: {
                    reviewee_id: employeeIds,
                    cycle_id: cycleId
                },
                attributes: ['reviewee_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                group: ['reviewee_id'],
                raw: true
            }),
            Review.findAll({
                where: {
                    reviewer_id: employeeIds,
                    cycle_id: cycleId,
                    status: 'completed'
                },
                attributes: ['reviewer_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                group: ['reviewer_id'],
                raw: true
            }),
            Review.findAll({
                where: {
                    reviewer_id: employeeIds,
                    cycle_id: cycleId
                },
                attributes: ['reviewer_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
                group: ['reviewer_id'],
                raw: true
            })
        ]);


        const receivedMap = {};
        reviewsReceived.forEach(r => receivedMap[r.reviewee_id] = parseInt(r.count));

        const expectedMap = {};
        totalReviewsExpected.forEach(r => expectedMap[r.reviewee_id] = parseInt(r.count));

        const writtenMap = {};
        reviewsWritten.forEach(r => writtenMap[r.reviewer_id] = parseInt(r.count));

        const toWriteMap = {};
        totalReviewsToWrite.forEach(r => toWriteMap[r.reviewer_id] = parseInt(r.count));

        const data = employees.map(emp => {
            const received = receivedMap[emp.id] || 0;
            const expected = expectedMap[emp.id] || 0;
            const written = writtenMap[emp.id] || 0;
            const toWrite = toWriteMap[emp.id] || 0;

            let status = 'Pending';
            if (written === toWrite && toWrite > 0) {
                status = 'Complete';
            }


            return {
                id: emp.id,
                name: emp.getDataValue('name'),
                role: emp.role,
                department: 'N/A',
                avatar: null,
                stats: {
                    reviewsReceived: received,
                    totalReviewsExpected: expected,
                    reviewsWritten: written,
                    totalReviewsToWrite: toWrite,
                    status
                }
            };
        });

        res.status(200).json({
            success: true,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            data
        });
    } else {
        res.status(200).json({
            success: true,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            data: []
        });
    }
});

exports.getEmployeeAudit = catchAsync(async (req, res, next) => {
    const { employeeId } = req.params;
    const { cycleId } = req.query;

    if (!cycleId) {
        return res.status(400).json({ success: false, message: 'cycleId is required' });
    }

    const employee = await User.findByPk(employeeId, {
        attributes: ['id', ['full_name', 'name'], 'role']
    });
    if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // 1. Fetch Reviews (Received)
    const reviews = await Review.findAll({
        where: {
            reviewee_id: employeeId,
            cycle_id: cycleId
        },
        attributes: ['id', 'status', 'created_at', 'reviewer_id', 'reviewee_id'],
        include: [
            {
                model: User,
                as: 'reviewer',
                attributes: ['id', ['full_name', 'name'], 'role']
            }
        ],
        raw: true,
        nest: true
    });

    const reviewIds = reviews.map(r => r.id);

    if (reviewIds.length === 0) {
        return res.status(200).json({
            success: true,
            data: {
                employee: {
                    id: employee.id,
                    name: employee.getDataValue('name'),
                    role: employee.role
                },
                meta: { reviewers: {}, skills: {}, questions: {} },
                rows: [],
                missingReviewers: []
            }
        });
    }

    // 2. Fetch Related Data in Parallel
    const [feedbacks, answers] = await Promise.all([
        ReviewSkillFeedback.findAll({
            where: { review_id: reviewIds },
            attributes: ['id', 'skill_id', 'score_override', 'comment', 'review_id'],
            include: [{
                model: Skill,
                as: 'skill',
                attributes: ['id', 'skill_name', 'category']
            }]
        }),
        ReviewAnswer.findAll({
            where: { review_id: reviewIds },
            attributes: ['id', 'score_value', 'review_id'],
            include: [{
                model: sequelize.models.QuestionVersion,
                as: 'questionVersion',
                attributes: ['id', 'question_text', 'question_type'],
                include: [{
                    model: sequelize.models.Question,
                    as: 'question',
                    attributes: ['id', 'skill_id']
                }]
            }]
        })
    ]);

    // 3. Map Data in Memory
    const meta = {
        reviewers: {},
        skills: {},
        questions: {}
    };




    const reviewsById = {};

    reviews.forEach(r => {
        reviewsById[r.id] = r;
        if (r.reviewer) {
            meta.reviewers[r.reviewer.id] = {
                name: r.reviewer.name,
                role: r.reviewer.role
            };
        }
    });

    // Group Answers by ReviewID -> SkillID
    const answersMap = {}; // reviewId -> skillId -> [answers]
    answers.forEach(a => {
        const rId = a.review_id;
        const qv = a.questionVersion;
        const q = qv?.question;
        const skillId = q?.skill_id;

        if (skillId) {
            if (!answersMap[rId]) answersMap[rId] = {};
            if (!answersMap[rId][skillId]) answersMap[rId][skillId] = [];

            if (!meta.questions[qv.id]) {
                meta.questions[qv.id] = {
                    text: qv.question_text,
                    type: qv.question_type
                };
            }

            answersMap[rId][skillId].push({
                aId: a.id,
                qId: qv.id,
                val: parseFloat(a.score_value)
            });
        }
    });

    // Assemble Rows from Feedbacks
    // Feedbacks link Skill -> Review. 
    const rows = [];

    feedbacks.forEach(fb => {
        const review = reviewsById[fb.review_id];
        if (!review) return;


        if (review.status !== 'completed') return;

        const skillId = fb.skill_id;
        const skill = fb.skill;

        if (skill && !meta.skills[skillId]) {
            meta.skills[skillId] = {
                name: skill.skill_name,
                category: skill.category
            };
        }

        const relatedAnswers = answersMap[fb.review_id]?.[skillId] || [];

        let totalScore = 0;
        if (fb.score_override !== null) {
            totalScore = parseFloat(fb.score_override);
        } else if (relatedAnswers.length > 0) {
            const sum = relatedAnswers.reduce((acc, a) => acc + a.val, 0);
            totalScore = sum / relatedAnswers.length;
        }

        rows.push({
            fId: fb.id,
            rId: review.reviewer?.id,
            revId: review.id,
            sId: skillId,
            score: parseFloat(totalScore.toFixed(2)),
            ovr: fb.score_override !== null,
            comm: fb.comment,
            ans: relatedAnswers,
            date: review.created_at
        });
    });


    const finalScoreEntry = await FinalScore.findOne({
        where: {
            user_id: employeeId,
            cycle_id: cycleId
        },
        attributes: ['final_score']
    });

    const overallScore = finalScoreEntry ? parseFloat(finalScoreEntry.final_score || 0).toFixed(2) : "0.00";


    const missingReviewers = reviews
        .filter(r => r.status !== 'completed')
        .map(r => ({
            id: r.reviewer?.id,
            name: r.reviewer?.name,
            role: r.reviewer?.role,
            status: r.status // 'pending'
        }));

    res.status(200).json({
        success: true,
        data: {
            employee: {
                id: employee.id,
                name: employee.getDataValue('name'),
                role: employee.role
            },
            overallScore, // Sending pre-calculated score
            meta,
            rows,
            missingReviewers
        }
    });
});

exports.getReviewerAudit = catchAsync(async (req, res, next) => {
    const { reviewerId } = req.params;
    const { cycleId } = req.query;

    if (!cycleId) {
        return res.status(400).json({ success: false, message: 'cycleId is required' });
    }

    const reviewer = await User.findByPk(reviewerId, {
        attributes: ['id', ['full_name', 'name'], 'role']
    });

    if (!reviewer) {
        return res.status(404).json({ success: false, message: 'Reviewer not found' });
    }

    // 1. Fetch Reviews (Written)
    const reviews = await Review.findAll({
        where: {
            reviewer_id: reviewerId,
            cycle_id: cycleId
        },
        attributes: ['id', 'status', 'created_at', 'reviewer_id', 'reviewee_id'],
        include: [
            {
                model: User,
                as: 'reviewee',
                attributes: ['id', ['full_name', 'name'], 'role']
            }
        ],
        raw: true,
        nest: true
    });

    const reviewIds = reviews.map(r => r.id);

    if (reviewIds.length === 0) {
        return res.status(200).json({
            success: true,
            data: {
                reviewer: {
                    id: reviewer.id,
                    name: reviewer.getDataValue('name'),
                    role: reviewer.role
                },
                meta: { reviewees: {}, skills: {}, questions: {} },
                rows: [],
                missingReviews: []
            }
        });
    }

    // 2. Fetch Related Data in Parallel
    const [feedbacks, answers] = await Promise.all([
        ReviewSkillFeedback.findAll({
            where: { review_id: reviewIds },
            attributes: ['id', 'skill_id', 'score_override', 'comment', 'review_id'],
            include: [{
                model: Skill,
                as: 'skill',
                attributes: ['id', 'skill_name', 'category']
            }]
        }),
        ReviewAnswer.findAll({
            where: { review_id: reviewIds },
            attributes: ['id', 'score_value', 'review_id'],
            include: [{
                model: sequelize.models.QuestionVersion,
                as: 'questionVersion',
                attributes: ['id', 'question_text', 'question_type'],
                include: [{
                    model: sequelize.models.Question,
                    as: 'question',
                    attributes: ['id', 'skill_id']
                }]
            }]
        })
    ]);

    // 3. Normalize Data
    const meta = {
        reviewees: {},
        skills: {},
        questions: {}
    };


    const reviewsById = {};
    reviews.forEach(r => {
        reviewsById[r.id] = r;
        if (r.reviewee) {
            meta.reviewees[r.reviewee.id] = {
                name: r.reviewee.name,
                role: r.reviewee.role
            };
        }
    });


    const answersMap = {};
    answers.forEach(a => {
        const rId = a.review_id;
        const qv = a.questionVersion;
        const q = qv?.question;
        const skillId = q?.skill_id;

        if (skillId) {
            if (!answersMap[rId]) answersMap[rId] = {};
            if (!answersMap[rId][skillId]) answersMap[rId][skillId] = [];

            if (!meta.questions[qv.id]) {
                meta.questions[qv.id] = {
                    text: qv.question_text,
                    type: qv.question_type
                };
            }

            answersMap[rId][skillId].push({
                aId: a.id,
                qId: qv.id,
                val: parseFloat(a.score_value)
            });
        }
    });


    const rows = [];
    feedbacks.forEach(fb => {
        const review = reviewsById[fb.review_id];
        if (!review || review.status !== 'completed') return;

        const skillId = fb.skill_id;
        const skill = fb.skill;

        if (skill && !meta.skills[skillId]) {
            meta.skills[skillId] = {
                name: skill.skill_name,
                category: skill.category
            };
        }

        const relatedAnswers = answersMap[fb.review_id]?.[skillId] || [];

        let totalScore = 0;
        if (fb.score_override !== null) {
            totalScore = parseFloat(fb.score_override);
        } else if (relatedAnswers.length > 0) {
            const sum = relatedAnswers.reduce((acc, a) => acc + a.val, 0);
            totalScore = sum / relatedAnswers.length;
        }

        rows.push({
            fId: fb.id,
            eeId: review.reviewee?.id,
            revId: review.id,
            sId: skillId,
            score: parseFloat(totalScore.toFixed(2)),
            ovr: fb.score_override !== null,
            comm: fb.comment,
            ans: relatedAnswers,
            date: review.created_at
        });
    });


    const missingReviews = reviews
        .filter(r => r.status !== 'completed')
        .map(r => ({
            id: r.reviewee?.id,
            name: r.reviewee?.name,
            role: r.reviewee?.role,
            status: r.status
        }));

    res.status(200).json({
        success: true,
        data: {
            reviewer: {
                id: reviewer.id,
                name: reviewer.getDataValue('name'),
                role: reviewer.role
            },
            meta,
            rows,
            missingReviews
        }
    });
});

exports.updateFeedbackOverride = catchAsync(async (req, res, next) => {
    const { feedbackId } = req.params;
    const { score, comment } = req.body;


    if (score !== undefined && score !== null) {
        const val = parseFloat(score);
        if (isNaN(val) || val < 0 || val > 10) {
            return res.status(400).json({ success: false, message: 'Score must be between 0 and 10' });
        }
    }

    const feedback = await ReviewSkillFeedback.findByPk(feedbackId, {
        include: [{ model: Review, attributes: ['cycle_id', 'reviewee_id'] }]
    });

    if (!feedback) {
        return res.status(404).json({ success: false, message: 'Feedback not found' });
    }


    if (score !== undefined) feedback.score_override = score;
    if (comment !== undefined) feedback.comment = comment;
    await feedback.save();

    // Recalculate Aggregates
    await recalculateUserSkillScore(
        feedback.Review.reviewee_id,
        feedback.skill_id,
        feedback.Review.cycle_id
    );

    res.status(200).json({ success: true, message: 'Feedback updated' });
});

exports.updateAnswer = catchAsync(async (req, res, next) => {
    const { answerId } = req.params;
    const { score } = req.body;

    // Validation
    if (score === undefined || score === null) {
        return res.status(400).json({ success: false, message: 'Score is required' });
    }
    const val = parseFloat(score);
    if (isNaN(val) || val < 0 || val > 10) { // Assuming 0-10 scale for now
        return res.status(400).json({ success: false, message: 'Score must be between 0 and 10' });
    }

    const answer = await ReviewAnswer.findByPk(answerId, {
        include: [{
            model: sequelize.models.QuestionVersion,
            as: 'questionVersion',
            include: [{
                model: sequelize.models.Question,
                as: 'question',
                attributes: ['id', 'skill_id']
            }]
        }, {
            model: Review,
            attributes: ['id', 'cycle_id', 'reviewee_id']
        }]
    });

    if (!answer) {
        return res.status(404).json({ success: false, message: 'Answer not found' });
    }

    answer.score_value = score;
    await answer.save();

    // Trigger Recalc
    if (answer.questionVersion?.question?.skill_id) {
        await recalculateUserSkillScore(
            answer.Review.reviewee_id,
            answer.questionVersion.question.skill_id,
            answer.Review.cycle_id
        );
    }


    res.status(200).json({ success: true, message: 'Score updated' });
});
