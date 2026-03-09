const {
    Review,
    ReviewAnswer,
    User,
    Skill,
    ReportingLine,
    UserSkillScore,
    FinalScore,
    sequelize
} = require('../models');

/**
 * Recalculates scores for a specific user in a specific cycle.
 * Uses Role-Based Competency Scoring (Method 2).
 * 
 * Logic:
 * 1. Identify Reviewee's Role (Employee, Manager, etc.)
 * 2. Fetch all valid reviews (excluding Self, usually).
 * 3. For each Skill:
 *    a. Calculate Average Rating (0-10) from all reviewers.
 *    b. Determine Max Points for this skill based on Reviewee's Role.
 *    c. Calculate Score: (AverageRating / 10) * MaxPoints.
 * 4. Sum up all Skill Scores to get Final Score (out of 100).
 */
exports.calculateScoreForUser = async (userId, cycleId, transaction) => {
    // 1. Fetch Reviewee to determine Role
    const reviewee = await User.findByPk(userId, { transaction });
    if (!reviewee) throw new Error('User not found');

    const isManagerRole = ['manager', 'admin'].includes(reviewee.role);

    // 2. Fetch completed reviews for this user
    // Exclude self-reviews from the score? 
    // Standard practice: Self-reviews are for comparison, not final score.
    const reviews = await Review.findAll({
        where: {
            reviewee_id: userId,
            cycle_id: cycleId,
            status: 'completed',
            // reviewer_id: { [Op.ne]: userId } // Needing Op. We filter manually to be safe if Op not imported.
        },
        transaction
    });

    const validReviews = reviews.filter(r => r.reviewer_id !== userId);
    const validReviewIds = validReviews.map(r => r.id);

    if (validReviewIds.length === 0) {
        // No reviews yet, cannot calculate score.
        // Optionally clear existing scores if they exist? ignoring for now.
        return 0;
    }

    // 3. Fetch Answers
    const answers = await ReviewAnswer.findAll({
        where: { review_id: validReviewIds },
        include: [
            {
                model: require('../models').QuestionVersion,
                as: 'questionVersion',
                include: [{
                    model: require('../models').Question,
                    as: 'question',
                    include: [{ model: Skill, as: 'skill' }]
                }]
            }
        ],
        transaction
    });

    // 4. Fetch Skills to get Weights (Max Points)
    const skills = await Skill.findAll({ where: { is_active: true }, transaction });
    const skillMap = {};
    skills.forEach(s => skillMap[s.id] = s);

    // 5. Group Answers by Skill
    const skillData = {}; // { skillId: { sum: 0, count: 0 } }

    for (const ans of answers) {
        // Validation: Ensure answer has skill
        const skill = ans.questionVersion?.question?.skill;
        if (!skill) continue;

        if (!skillData[skill.id]) {
            skillData[skill.id] = { sum: 0, count: 0 };
        }

        // Ensure score is valid number
        const score = Number(ans.score_value);
        if (!isNaN(score)) {
            skillData[skill.id].sum += score;
            skillData[skill.id].count++;
        }
    }

    // 6. Calculate & Save Scores
    let totalPointsObtained = 0; // This will now be out of 10 (Weighted Average)
    let totalWeights = 0;

    for (const skill of skills) {
        const data = skillData[skill.id] || { sum: 0, count: 0 };

        // A. Average Rating (0-10)
        // If count is 0, Average is 0.
        const averageRating = data.count > 0 ? (data.sum / data.count) : 0;

        // B. Max Points (Weight) for this Role
        const weight = isManagerRole ? Number(skill.weight_manager) : Number(skill.weight_employee);

        // C. Calculate Weighted Contribution
        // Logic: The rating (0-10) contributes to the final score proportional to its weight.
        // Formula: Rating * (Weight / 100)
        // Example: Rating 8, Weight 16. Contribution = 8 * 0.16 = 1.28.
        const weightedContribution = averageRating * (weight / 100);

        totalWeights += weight;
        totalPointsObtained += weightedContribution;

        // Upsert UserSkillScore
        const existingScore = await UserSkillScore.findOne({
            where: { user_id: userId, cycle_id: cycleId, skill_id: skill.id },
            transaction
        });

        const updateData = {
            score_obtained: averageRating, // Raw score out of 10
            weighted_score: weightedContribution, // Contribution to the final total
            skill_weight_snapshot: weight
        };

        if (existingScore) {
            await existingScore.update(updateData, { transaction });
        } else {
            await UserSkillScore.create({
                user_id: userId,
                cycle_id: cycleId,
                skill_id: skill.id,
                ...updateData
            }, { transaction });
        }
    }

    // 7. Save Final Score
    // totalPointsObtained is already the Weighted Average out of 10 (assuming weights sum to 100).
    // If weights don't sum to exactly 100, we might need to normalize: (SumWeighted / TotalWeight) * 10?
    // Let's be safe: If TotalWeights > 0, normalize.

    let finalScoreValue = totalPointsObtained;
    if (totalWeights > 0 && totalWeights !== 100) {
        // Example: SumWeighted = 84, TotalWeight = 1000? -> (84/1000)*100 = 8.4
        // Logic: Sum(Rating * Weight) / Sum(Weights) -> Weighted Average (0-10)
        // My weightedContribution calc was: Rating * (Weight / 100).
        // Real Weighted Avg = (Sum(Rating * Weight) / Sum(Weights))
        //                   = (totalPointsObtained * 100) / totalWeights
        finalScoreValue = (totalPointsObtained * 100) / totalWeights;
    }

    const existingFinal = await FinalScore.findOne({
        where: { user_id: userId, cycle_id: cycleId },
        transaction
    });

    if (existingFinal) {
        await existingFinal.update({
            calculated_total_score: finalScoreValue,
            final_score: finalScoreValue // Unless admin override exists? We override it for now.
        }, { transaction });
    } else {
        await FinalScore.create({
            user_id: userId,
            cycle_id: cycleId,
            calculated_total_score: finalScoreValue,
            final_score: finalScoreValue
        }, { transaction });
    }

    return finalScoreValue;
};
