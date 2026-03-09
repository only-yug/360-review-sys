const cron = require('node-cron');
const { EvaluationCycle, sequelize } = require('../models');
const { Op } = require('sequelize');

class SchedulerService {
    constructor() {
        this.cronSchedule = '0 0 * * *'; // Run every day at midnight
    }

    init() {
        console.log('Scheduler Service Initialized');

        // Schedule the daily task
        cron.schedule(this.cronSchedule, async () => {
            await this.runDailyTasks();
        });

        // Run immediately on startup to catch up if we missed the midnight window
        this.runDailyTasks();
    }

    async runDailyTasks() {
        console.log('Running Daily Scheduler Tasks...');
        try {
            await this.activatePendingCycles(); // Event A: Open Window
            await this.closeAndSpawnNextCycle(); // Event B: Close & Spawn
            console.log('Daily Tasks Completed');
        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    }

    /**
     * Event A: Opening the Window (Activation)
     * Activates 'Pending' cycles where Start Date has arrived.
     */
    /**
     * Event A: Opening the Window (Activation)
     * Activates 'Pending' cycles where Start Date has arrived.
     */
    async activatePendingCycles() {
        const today = new Date();
        // console.log(`Checking for cycles to activate on: ${today.toDateString()}`); // Optional: keep or remove log

        const cyclesToStart = await EvaluationCycle.findAll({
            where: {
                is_active: false,
                start_date: { [Op.lte]: today },
                end_date: { [Op.gte]: today }
                // Ensure we don't activate expired ones (failsafe)
            }
        });

        if (cyclesToStart.length > 0) {
            const reviewService = require('./reviewService');

            for (const cycle of cyclesToStart) {
                const t = await sequelize.transaction();
                try {
                    console.log(`Activating Cycle: ${cycle.cycle_name}`);
                    await cycle.update({ is_active: true }, { transaction: t });
                    await reviewService.generateReviewsForCycle(cycle.id, t);
                    await t.commit();
                    // TODO: Trigger Email Notifications here
                } catch (error) {
                    await t.rollback();
                    console.error(`Failed to activate cycle ${cycle.id}:`, error);
                }
            }
        }
    }

    /**
     * Event B: Closing & Spawning (Replication)
     * Closes 'Active' cycles where End Date has passed.
     * If 'frequency_months' is set, spawns the next cycle.
     */
    async closeAndSpawnNextCycle() {
        const today = new Date();

        const cyclesToClose = await EvaluationCycle.findAll({
            where: {
                is_active: true,
                end_date: { [Op.lt]: today }
            }
        });

        for (const cycle of cyclesToClose) {
            const t = await sequelize.transaction();
            try {
                // 1. Close current cycle
                console.log(`Closing Expired Cycle: ${cycle.cycle_name}`);
                await cycle.update({ is_active: false }, { transaction: t });

                // 2. Spawn next cycle (if frequency set)
                if (cycle.frequency_months && cycle.frequency_months > 0) {
                    await this.spawnNextCycle(cycle, t);
                }

                await t.commit();
            } catch (error) {
                await t.rollback();
                console.error(`Failed to close/spawn for cycle ${cycle.id}:`, error);
            }
        }
    }

    /**
     * Helper: Creates the next cycle based on the parent
     */
    async spawnNextCycle(parentCycle, transaction) {
        const monthsToAdd = parentCycle.frequency_months;

        // Calculate new dates with Clamping logic
        const newStartDate = this.addMonthsClamped(parentCycle.start_date, monthsToAdd);
        const newEndDate = this.addMonthsClamped(parentCycle.end_date, monthsToAdd);
        // Ensure End Date is end of day
        newEndDate.setHours(23, 59, 59, 999);

        // Dynamic Naming Strategy
        // 1. Strip existing " - Month Year" suffix if present to get clean base name
        const baseName = parentCycle.cycle_name.replace(/ - [a-zA-Z]+ \d{4}$/, '');
        // 2. Append new Month Year
        const suffix = newStartDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        const newName = `${baseName} - ${suffix}`;

        // Check for duplicates
        const duplicate = await EvaluationCycle.findOne({
            where: { cycle_name: newName },
            transaction
        });

        if (duplicate) {
            console.log(`Child cycle already exists: ${newName}`);
            return;
        }

        console.log(`Spawning Next Cycle: ${newName}`);
        await EvaluationCycle.create({
            cycle_name: newName,
            start_date: newStartDate,
            end_date: newEndDate,
            is_active: false, // Starts as Pending
            frequency_months: parentCycle.frequency_months // Pass the baton
        }, { transaction });
    }

    /**
     * Helper: Date Math with Clamping
     * Standard JS rolls over (Feb 30 -> Mar 2). We want Feb 28.
     */
    addMonthsClamped(date, months) {
        const target = new Date(date);
        const expectedMonth = (target.getMonth() + months) % 12;

        // Add months
        target.setMonth(target.getMonth() + months);

        // Check for overflow (if month jumped 2 steps instead of 1, or mismatch)
        // Actually, simple logic:
        // If original day was 31, and new month has 30 days, setMonth moves to 1st of next month.
        // We detect this if target.getDate() != original.getDate().
        // Wait, simpler approach:

        const d = new Date(date);
        const desiredMonth = d.getMonth() + months;
        d.setMonth(desiredMonth);

        if (d.getDate() !== date.getDate()) {
            // Logic: rollover happened. Go to 0th day of current month (last day of previous)
            d.setDate(0);
        }
        return d;
    }
}

module.exports = new SchedulerService();
