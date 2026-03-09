const { EvaluationCycle, sequelize } = require('./src/models');
const reviewService = require('./src/services/reviewService');

async function run() {
    try {
        console.log('--- Adding Single Past Cycle (Dec 2025) ---');

        // Target: Dec 17 2025 - Dec 19 2025
        // (Assuming current date is Feb 2026, so 2 months back)
        const start = new Date('2025-12-17');
        const end = new Date('2025-12-19');

        console.log(`Dates: ${start.toDateString()} -> ${end.toDateString()}`);

        // 1. Create Cycle (Inactive/Closed)
        const cycle = await EvaluationCycle.create({
            cycle_name: `Past Cycle - December 2025`,
            start_date: start,
            end_date: end,
            is_active: false, // Closed
            frequency_months: 1
        });

        console.log(`Created Cycle ID: ${cycle.id}`);

        // 2. Generate Reviews Manually
        console.log('Generating Reviews...');
        const transaction = await sequelize.transaction();
        try {
            const count = await reviewService.generateReviewsForCycle(cycle.id, transaction);
            await transaction.commit();
            console.log(`Success! Generated ${count} reviews for Cycle ID ${cycle.id}`);
        } catch (err) {
            await transaction.rollback();
            console.error('Failed to generate reviews:', err);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

run();
