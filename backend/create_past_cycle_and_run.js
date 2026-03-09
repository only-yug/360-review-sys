const { EvaluationCycle, sequelize } = require('./src/models');
const schedulerService = require('./src/services/schedulerService');

async function run() {
    try {
        console.log('--- Setting up Test Scenario ---');

        // 1. Calculate Dates
        // Current: Feb 17 2026
        // Past Start: Jan 17 2026
        // Past End: Jan 19 2026

        const now = new Date(); // Should be Feb 17 2026 based on system time
        console.log(`Current Time: ${now.toString()}`);

        const pastStart = new Date(now);
        pastStart.setMonth(pastStart.getMonth() - 1); // Jan 17

        const pastEnd = new Date(pastStart);
        pastEnd.setDate(pastEnd.getDate() + 2); // Jan 19

        console.log(`Creating Past Cycle: ${pastStart.toDateString()} -> ${pastEnd.toDateString()}`);

        // 2. Create Cycle
        const cycle = await EvaluationCycle.create({
            cycle_name: `Test Cycle - ${pastStart.toLocaleString('default', { month: 'long' })} 2026`,
            start_date: pastStart,
            end_date: pastEnd,
            is_active: true, // It was active
            frequency_months: 1
        });

        console.log(`Created Cycle ID: ${cycle.id}`);

        // 3. Trigger Scheduler
        console.log('\n--- Running Scheduler (Pass 1) ---');
        // This should detect it's expired -> Close it -> Spawn Next (Feb 17)
        await schedulerService.runDailyTasks();

        console.log('\n--- Running Scheduler (Pass 2) ---');
        // This should detect Feb 17 is today -> Activate it
        await schedulerService.runDailyTasks();

        // 4. Verification
        console.log('\n--- Verification ---');
        const allCycles = await EvaluationCycle.findAll({
            order: [['created_at', 'DESC']],
            limit: 3
        });

        allCycles.forEach(c => {
            console.log(`ID: ${c.id} | Name: ${c.cycle_name} | Active: ${c.is_active} | Start: ${c.start_date.toDateString()} | End: ${c.end_date.toDateString()}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

run();
