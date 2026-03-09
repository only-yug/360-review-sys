'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('evaluation_cycles', 'start_date', {
            type: Sequelize.DATE,
            allowNull: true, // Allow null for existing cycles
        });
        await queryInterface.addColumn('evaluation_cycles', 'end_date', {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await queryInterface.addColumn('evaluation_cycles', 'frequency_months', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Auto-replication frequency in months. Null = One-time cycle.'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('evaluation_cycles', 'start_date');
        await queryInterface.removeColumn('evaluation_cycles', 'end_date');
        await queryInterface.removeColumn('evaluation_cycles', 'frequency_months');
    }
};
