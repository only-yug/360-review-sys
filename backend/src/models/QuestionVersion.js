const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const QuestionVersion = sequelize.define('QuestionVersion', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        question_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'questions',
                key: 'id',
            },
        },
        question_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        question_type: {
            type: DataTypes.ENUM('scale_1_10', 'yes_no'),
            allowNull: false,
        },
        version_number: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'question_versions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false, // No updated_at for logs
        deletedAt: false, // No soft delete for logs
        underscored: true,
    });

    return QuestionVersion;
};
