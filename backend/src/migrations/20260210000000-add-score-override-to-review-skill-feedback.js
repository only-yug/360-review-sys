'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDescription = await queryInterface.describeTable('review_skill_feedback');
        if (!tableDescription.score_override) {
            await queryInterface.addColumn('review_skill_feedback', 'score_override', {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
                comment: 'Manual override score by admin'
            });
        }
    },

    async down(queryInterface, Sequelize) {
        const tableDescription = await queryInterface.describeTable('review_skill_feedback');
        if (tableDescription.score_override) {
            await queryInterface.removeColumn('review_skill_feedback', 'score_override');
        }
    }
};
