'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add composite index for reviewer queries
        await queryInterface.addIndex('reviews', ['reviewer_id', 'cycle_id'], {
            name: 'idx_reviews_reviewer_cycle'
        });

        // Add composite index for reviewee queries
        await queryInterface.addIndex('reviews', ['reviewee_id', 'cycle_id'], {
            name: 'idx_reviews_reviewee_cycle'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('reviews', 'idx_reviews_reviewer_cycle');
        await queryInterface.removeIndex('reviews', 'idx_reviews_reviewee_cycle');
    }
};
