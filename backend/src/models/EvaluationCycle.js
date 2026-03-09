const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const EvaluationCycle = sequelize.define('EvaluationCycle', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        cycle_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        frequency_months: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Auto-replication frequency in months. Null = One-time cycle.'
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
        tableName: 'evaluation_cycles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
        underscored: true,
    });

    return EvaluationCycle;
};
