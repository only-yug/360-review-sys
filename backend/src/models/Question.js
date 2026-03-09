const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Question = sequelize.define('Question', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        skill_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Should strictly be not null, but let's follow if referenced
            references: {
                model: 'skills',
                key: 'id',
            },
        },
        current_version_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // References 'question_versions' table, but circular dependency exists.
            // We will handle the foreign key constraint in index.js or let Sequelize handle it.
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
        tableName: 'questions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
        underscored: true,
    });

    return Question;
};
