const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ReviewAnswer = sequelize.define('ReviewAnswer', {
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
        question_version_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'question_versions',
                key: 'id',
            },
        },
        score_value: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
        tableName: 'review_answers',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
        underscored: true,
    });

    return ReviewAnswer;
};
