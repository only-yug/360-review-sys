const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ReviewSkillFeedback = sequelize.define('ReviewSkillFeedback', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        review_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'reviews',
                key: 'id',
            },
        },
        skill_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'skills',
                key: 'id',
            },
        },
        skill_name_snapshot: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        score_override: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Manual override score by admin'
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
        },
        deleted_at: {
            type: DataTypes.DATE,
        },
    }, {
        tableName: 'review_skill_feedback',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
        underscored: true,
    });

    return ReviewSkillFeedback;
};
