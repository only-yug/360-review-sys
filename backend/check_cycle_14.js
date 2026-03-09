const { sequelize, EvaluationCycle, Review, User, ReviewAnswer, ReviewSkillFeedback } = require('./src/models');

async function check() {
    try {
        const cycleId = 14;
        console.log(`Checking Cycle ${cycleId}...`);
        const cycle = await EvaluationCycle.findByPk(cycleId);
        if (!cycle) {
            console.log('Cycle 14 not found!');
            return;
        }
        console.log(`Cycle Name: ${cycle.cycle_name}`);
        console.log(`Status: ${cycle.is_active ? 'Active' : 'Inactive'}`);

        const reviews = await Review.findAll({
            where: { cycle_id: cycleId },
            include: [
                { model: User, as: 'reviewer', attributes: ['id', 'full_name', 'role'] },
                { model: User, as: 'reviewee', attributes: ['id', 'full_name', 'role'] }
            ]
        });

        console.log(`Total Reviews: ${reviews.length}`);

        // Distribution
        const byReviewer = {};
        const byReviewee = {};
        let pending = 0;
        let completed = 0;

        const reviewerNames = {};
        const revieweeNames = {};

        for (const r of reviews) {
            const reviewerId = r.reviewer_id;
            const revieweeId = r.reviewee_id;

            byReviewer[reviewerId] = (byReviewer[reviewerId] || 0) + 1;
            byReviewee[revieweeId] = (byReviewee[revieweeId] || 0) + 1;

            if (r.reviewer) reviewerNames[reviewerId] = r.reviewer.full_name + ` (${r.reviewer.role})`;
            if (r.reviewee) revieweeNames[revieweeId] = r.reviewee.full_name + ` (${r.reviewee.role})`;

            if (r.status === 'completed') completed++;
            else pending++;
        }

        console.log(`Status: ${completed} Completed, ${pending} Pending`);

        console.log('\n--- Load by Reviewer (Top 5) ---');
        Object.entries(byReviewer)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([id, count]) => {
                console.log(`${reviewerNames[id] || id}: ${count} reviews to write`);
            });

        console.log('\n--- Load by Reviewee (Top 5) ---');
        Object.entries(byReviewee)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([id, count]) => {
                console.log(`${revieweeNames[id] || id}: ${count} reviews received`);
            });

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

check();
