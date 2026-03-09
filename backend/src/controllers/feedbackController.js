const { Review, ReviewAnswer, ReviewSkillFeedback, User, EvaluationCycle, Question, Skill } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const getMyPendingReviews = catchAsync(async (req, res, next) => {
  const { status } = req.query;
  const where = {
    reviewer_id: req.user.id,
    status: status || 'pending'
  };

  const reviews = await Review.findAll({
    where,
    include: [
      {
        model: User,
        as: 'reviewee',
        attributes: ['id', 'full_name', 'email', 'role']
      },
      {
        model: EvaluationCycle,
        attributes: ['id', 'cycle_name', 'is_active']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  res.json({
    success: true,
    data: { feedbackRequests: reviews }
  });
});

// Helper: Get Validation Rules based on Relationship
const getValidationRules = async (reviewerId, revieweeId, userRole) => {
  // Default: Everything is Optional (Skip allowed)
  const rules = {
    tech: false,    // true = Mandatory, false = Optional
    nonTech: false
  };

  const { ReportingLine } = require('../models');

  // 1. Admin (Enforce Strictness)
  // If 'admin', we assume they should provide full reviews (Technical + Non-Tech)
  if (userRole === 'admin' && reviewerId !== revieweeId) {

    return { tech: true, nonTech: true };
  }
  if (reviewerId === revieweeId) return rules;

  // 3. Manager -> Direct Report (Strict: CANNOT SKIP)
  const amIManager = await ReportingLine.findOne({
    where: { employee_id: revieweeId, manager_id: reviewerId, is_active: true }
  });


  if (amIManager) {
    return { tech: true, nonTech: true }; // STRICT
  }

  // 4. Peer -> Peer
  const myManagers = await ReportingLine.findAll({ where: { employee_id: reviewerId, is_active: true } });
  const myManagerIds = myManagers.map(m => m.manager_id);
  const theirManagers = await ReportingLine.findAll({ where: { employee_id: revieweeId, is_active: true } });
  const theirManagerIds = theirManagers.map(m => m.manager_id);

  const isPeer = myManagerIds.some(id => theirManagerIds.includes(id));


  if (isPeer) {
    return { tech: false, nonTech: true };
  }



  return rules;
};

const getReviewInterface = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const viewerId = req.user.id;

  const review = await Review.findByPk(id, {
    include: [
      {
        model: User,
        as: 'reviewee',
        attributes: ['id', 'full_name', 'email', 'role']
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'full_name', 'email']
      },
      {
        model: EvaluationCycle,
        attributes: ['id', 'cycle_name', 'is_active']
      },
      {
        model: require('../models').ReviewAnswer,
        as: 'answers',
        required: false,
        attributes: ['question_version_id', 'score_value']
      },
      {
        model: require('../models').ReviewSkillFeedback,
        as: 'feedback',
        required: false,
        attributes: ['skill_id', 'comment']
      }
    ]
  });

  if (!review) {
    return next(new AppError('Review request not found', 404));
  }


  if (
    review.reviewer_id !== viewerId &&
    review.reviewee_id !== viewerId &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('Access denied', 403));
  }


  const rules = await getValidationRules(viewerId, review.reviewee_id, req.user.role);

  // 2. Fetch ALL Active Skills (No filtering "where" clause for category)
  const skills = await Skill.findAll({
    where: { is_active: true },
    include: [{
      model: Question,
      as: 'questions',
      where: { is_active: true },
      required: false,
      include: [{
        model: require('../models').QuestionVersion,
        as: 'currentVersion',
        attributes: ['id', 'question_text', 'question_type']
      }]
    }],
    order: [['category', 'ASC'], ['skill_name', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      feedbackRequest: review,
      form: skills,
      meta: {
        validationRules: rules
      }
    }
  });
});

const submitReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { answers, comments, submit = true } = req.body;
  // submit: true -> Mark as completed (Finalize)
  // submit: false -> Save as draft (Keep pending)

  const review = await Review.findByPk(id);

  if (!review) {
    return next(new AppError('Review request not found', 404));
  }

  if (review.reviewer_id !== req.user.id) {
    return next(new AppError('You are not authorized to submit feedback for this request', 403));
  }

  // Check if cycle is active
  const cycle = await EvaluationCycle.findByPk(review.cycle_id);
  if (!cycle || !cycle.is_active) {
    return next(new AppError('Cannot submit review: Evaluation cycle is closed or inactive.', 400));
  }

  if (review.status === 'completed') {
    return next(new AppError('Feedback already submitted for this request', 400));
  }

  const { sequelize } = require('../models');
  const t = await sequelize.transaction();

  try {
    // 1. Save Answers (Scores)
    if (answers && Array.isArray(answers)) {

      await ReviewAnswer.destroy({ where: { review_id: review.id }, transaction: t });
      const answerRecords = answers
        .filter(ans => ans.score !== null && ans.score !== undefined && ans.score !== '')
        .map(ans => ({
          review_id: review.id,
          question_version_id: ans.questionId,
          score_value: ans.score
        }));
      if (answerRecords.length > 0) {
        await ReviewAnswer.bulkCreate(answerRecords, { transaction: t });
      }
    }

    // 2. Save Comments
    if (comments && Array.isArray(comments)) {
      await ReviewSkillFeedback.destroy({ where: { review_id: review.id }, transaction: t });
      const commentRecords = comments
        .filter(cmt => cmt.comment && cmt.comment.trim() !== '')
        .map(cmt => ({
          review_id: review.id,
          skill_id: cmt.skillId,
          comment: cmt.comment
        }));
      if (commentRecords.length > 0) {
        await ReviewSkillFeedback.bulkCreate(commentRecords, { transaction: t });
      }
    }


    if (submit) {
      const rules = await getValidationRules(req.user.id, review.reviewee_id, req.user.role);


      const expectedSkills = await Skill.findAll({
        where: { is_active: true },
        include: [{
          model: Question,
          as: 'questions',
          where: { is_active: true },
          required: false
        }],
        transaction: t
      });


      const existingAnswers = await ReviewAnswer.findAll({ where: { review_id: review.id }, transaction: t });
      const existingComments = await ReviewSkillFeedback.findAll({ where: { review_id: review.id }, transaction: t });

      const errors = [];

      for (const skill of expectedSkills) {

        const isMandatory = skill.category === 'technical' ? rules.tech : rules.nonTech;



        if (isMandatory) {

          const hasComment = existingComments.some(c => c.skill_id === skill.id); // Valid check?
          if (!hasComment) {

            errors.push(`Missing mandatory comment for skill: ${skill.skill_name}`);
          }


          for (const question of skill.questions) {
            const isAnswered = existingAnswers.some(a => a.question_version_id === question.current_version_id);
            // console.log(`DEBUG: Question ${question.id} (Ver: ${question.current_version_id}) Answered? ${isAnswered}`);

            if (!isAnswered) {
              const qText = question.currentVersion ? question.currentVersion.question_text : `ID:${question.id}`;
              errors.push(`Missing mandatory answer for question: "${qText}" in ${skill.skill_name}`);
            }
          }
        }
      }

      if (errors.length > 0) {

        // Clean up transaction
        await t.rollback();
        return next(new AppError('Incomplete review: ' + errors.join(', '), 400));
      }

      await review.update({ status: 'completed' }, { transaction: t });
    }

    await t.commit();


    if (submit) {
      try {
        const scoringService = require('../services/scoringService');
        await scoringService.calculateScoreForUser(review.reviewee_id, review.cycle_id);
      } catch (scoreErr) {
        console.error('Real-time scoring failed:', scoreErr);
        // Do not fail the request, just log it. The review is saved.
      }
    }

    res.status(200).json({
      success: true,
      message: submit ? 'Feedback submitted successfully' : 'Draft saved successfully',

    });
  } catch (error) {
    await t.rollback();
    return next(new AppError('Failed to submit feedback: ' + error.message, 500));
  }
});

const getMyFeedback = catchAsync(async (req, res, next) => {
  const reviews = await Review.findAll({
    where: {
      reviewee_id: req.user.id,
      status: 'completed'
    },
    include: [
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'full_name', 'email']
      },
      {
        model: EvaluationCycle,
        attributes: ['id', 'cycle_name', 'is_active']
      },
      {
        model: ReviewAnswer,
        as: 'answers',
        include: [{
          model: require('../models').QuestionVersion,
          as: 'questionVersion',
          include: [{ model: require('../models').Question, as: 'question', include: ['skill'] }]
        }]
      },
      {
        model: ReviewSkillFeedback,
        as: 'feedback'
      }
    ],
    order: [['updated_at', 'DESC']]
  });



  res.json({
    success: true,
    data: { feedbackRequests: reviews }
  });
});

const getReviewStatus = catchAsync(async (req, res, next) => {
  const { cycle_id } = req.query;
  const reviewerId = req.user.id;

  const where = {
    reviewer_id: reviewerId
  };

  if (cycle_id) {
    where.cycle_id = cycle_id;
  }

  const reviews = await Review.findAll({
    where,
    include: [
      {
        model: User,
        as: 'reviewee',
        attributes: ['id', 'full_name', 'email', 'role']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  const pending = reviews.filter(r => r.status === 'pending');
  const completed = reviews.filter(r => r.status === 'completed');

  res.status(200).json({
    success: true,
    data: {
      pending,
      completed
    }
  });
});

module.exports = {
  getMyPendingReviews,
  getReviewInterface,
  submitReview,
  getMyFeedback,
  getReviewStatus
};
