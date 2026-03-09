const { EvaluationCycle, Review, sequelize } = require('./src/models');
const reviewService = require('./src/services/reviewService');

async function forceActivate() {
    try {
        console.log('--- Force Activating Past Cycle ---');

        // 1. Find the target cycle (ID 18)
        const cycle = await EvaluationCycle.findByPk(18);
        if (!cycle) {
            console.log('Cycle 18 not found');
            return;
        }

        console.log(`Cycle: ${cycle.cycle_name} (Active: ${cycle.is_active})`);

        // 2. Activate & Generate
        const transaction = await sequelize.transaction();
        try {
            // Activate
            await cycle.update({ is_active: true }, { transaction });
            console.log('Set to Active.');

            // Generate
            const count = await reviewService.generateReviewsForCycle(cycle.id, transaction);
            console.log(`Generated ${count} reviews.`);

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            console.error('Failed:', err);
        }

        // 3. Optional: Deactivate it again to match "Closed" state?
        // The user said "add 1 cycle of past data". Usually past data implies the cycle is closed.
        // So let's close it now.
        await cycle.update({ is_active: false });
        console.log('Set to Inactive (Closed).');

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

forceActivate();
