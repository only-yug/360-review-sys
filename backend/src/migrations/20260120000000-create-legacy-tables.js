'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Evaluation Cycles (Base Table)
        await queryInterface.createTable('evaluation_cycles', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            cycle_name: { type: Sequelize.STRING(255), allowNull: false },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: false },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updated_at: { type: Sequelize.DATE },
            deleted_at: { type: Sequelize.DATE } // paranoid
        });

        // 2. Skills
        await queryInterface.createTable('skills', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            skill_name: { type: Sequelize.STRING(255), allowNull: false },
            category: { type: Sequelize.ENUM('technical', 'non_technical'), allowNull: false },
            weight_employee: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
            weight_manager: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updated_at: { type: Sequelize.DATE },
            deleted_at: { type: Sequelize.DATE }
        });

        // 3. Questions (Create first without FK to versions due to circular dependency)
        await queryInterface.createTable('questions', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            skill_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'skills', key: 'id' }
            },
            current_version_id: { type: Sequelize.INTEGER, allowNull: true }, // FK added later
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updated_at: { type: Sequelize.DATE },
            deleted_at: { type: Sequelize.DATE }
        });

        // 4. Question Versions
        await queryInterface.createTable('question_versions', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            question_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'questions', key: 'id' }
            },
            question_text: { type: Sequelize.TEXT, allowNull: false },
            question_type: { type: Sequelize.ENUM('scale_1_10', 'yes_no'), allowNull: false },
            version_number: { type: Sequelize.INTEGER, defaultValue: 1 },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
        });

        // 5. Reporting Lines
        await queryInterface.createTable('reporting_lines', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            employee_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' }
            },
            manager_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' }
            },
            relationship_type: { type: Sequelize.STRING(50), allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updated_at: { type: Sequelize.DATE },
            deleted_at: { type: Sequelize.DATE }
        });

        // 6. Reviews
        await queryInterface.createTable('reviews', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            cycle_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'evaluation_cycles', key: 'id' }
            },
            reviewer_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' }
            },
            reviewee_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' }
            },
            status: { type: Sequelize.ENUM('pending', 'completed'), defaultValue: 'pending' },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updated_at: { type: Sequelize.DATE },
            deleted_at: { type: Sequelize.DATE }
        });

        // 7. Review Answers
        await queryInterface.createTable('review_answers', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            review_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'reviews', key: 'id' }
            },
            question_version_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'question_versions', key: 'id' }
            },
            score_value: { type: Sequelize.INTEGER, allowNull: false },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updated_at: { type: Sequelize.DATE },
            deleted_at: { type: Sequelize.DATE }
        });

        // 8. Review Skill Feedback
        await queryInterface.createTable('review_skill_feedback', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            review_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'reviews', key: 'id' }
            },
            skill_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'skills', key: 'id' }
            },
            skill_name_snapshot: { type: Sequelize.STRING(255), allowNull: true },
            comment: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updated_at: { type: Sequelize.DATE },
            deleted_at: { type: Sequelize.DATE }
        });

        // 9. Team Change Requests
        await queryInterface.createTable('team_change_requests', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            employee_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' }
            },
            current_manager_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' }
            },
            target_manager_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' }
            },
            status: {
                type: Sequelize.ENUM('pending', 'approved', 'rejected'),
                defaultValue: 'pending'
            },
            request_type: {
                type: Sequelize.ENUM('transfer', 'join_additional'),
                defaultValue: 'transfer'
            },
            request_date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updated_at: { type: Sequelize.DATE },
            deleted_at: { type: Sequelize.DATE }
        });

        // 10. User Skill Scores
        await queryInterface.createTable('user_skill_scores', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            cycle_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'evaluation_cycles', key: 'id' }
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' }
            },
            skill_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'skills', key: 'id' }
            },
            score_obtained: { type: Sequelize.DECIMAL(5, 2) },
            weighted_score: { type: Sequelize.DECIMAL(5, 2) },
            skill_weight_snapshot: { type: Sequelize.DECIMAL(5, 2) },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updated_at: { type: Sequelize.DATE },
            deleted_at: { type: Sequelize.DATE }
        });

        // 11. Final Scores
        await queryInterface.createTable('final_scores', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            cycle_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'evaluation_cycles', key: 'id' }
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' }
            },
            calculated_total_score: { type: Sequelize.DECIMAL(5, 2) },
            admin_override_score: { type: Sequelize.DECIMAL(5, 2) },
            final_score: { type: Sequelize.DECIMAL(5, 2) },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updated_at: { type: Sequelize.DATE },
            deleted_at: { type: Sequelize.DATE }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('final_scores');
        await queryInterface.dropTable('user_skill_scores');
        await queryInterface.dropTable('team_change_requests');
        await queryInterface.dropTable('review_skill_feedback');
        await queryInterface.dropTable('review_answers');
        await queryInterface.dropTable('reviews');
        await queryInterface.dropTable('reporting_lines');
        await queryInterface.dropTable('question_versions');
        await queryInterface.dropTable('questions');
        await queryInterface.dropTable('skills');
        await queryInterface.dropTable('evaluation_cycles');
    }
};
