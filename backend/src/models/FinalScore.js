const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const FinalScore = sequelize.define('FinalScore', {
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
        calculated_total_score: {
            type: DataTypes.DECIMAL(5, 2),
        },
        admin_override_score: {
            type: DataTypes.DECIMAL(5, 2),
        },
        final_score: {
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
        tableName: 'final_scores',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
        underscored: true,
    });

    return FinalScore;
};
