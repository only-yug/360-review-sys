const { EvaluationCycle, sequelize } = require('./src/models');

async function list() {
    try {
        const cycles = await EvaluationCycle.findAll({
            order: [['id', 'DESC']]
        });

        console.log('--- All Cycles ---');
        cycles.forEach(c => {
            console.log(`ID: ${c.id}`);
            console.log(`Name: ${c.cycle_name}`);
            console.log(`Active: ${c.is_active}`);
            console.log(`Start: ${c.start_date}`);
            console.log(`End: ${c.end_date}`);
            console.log('-------------------');
        });

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

list();
