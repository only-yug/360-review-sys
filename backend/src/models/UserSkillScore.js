const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserSkillScore = sequelize.define('UserSkillScore', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        cycle_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'evaluation_cycles',
                key: 'id',
            },
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
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
        score_obtained: {
            type: DataTypes.DECIMAL(5, 2),
        },
        weighted_score: {
            type: DataTypes.DECIMAL(5, 2),
        },
        skill_weight_snapshot: {
            type: DataTypes.DECIMAL(5, 2),
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
        tableName: 'user_skill_scores',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
        underscored: true,
    });

    return UserSkillScore;
};
