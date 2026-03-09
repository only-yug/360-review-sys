const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Skill = sequelize.define('Skill', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        skill_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        category: {
            type: DataTypes.ENUM('technical', 'non_technical'),
            allowNull: false,
        },
        weight_employee: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0,
        },
        weight_manager: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
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
        tableName: 'skills',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
        underscored: true,
    });

    return Skill;
};
