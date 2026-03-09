const { Skill, Question, QuestionVersion } = require('../models');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllSkills = catchAsync(async (req, res, next) => {
    const skills = await Skill.findAll({
        include: [{
            model: Question,
            as: 'questions',
            include: [{
                model: QuestionVersion,
                as: 'currentVersion',
                attributes: ['id', 'question_text', 'question_type']
            }]
        }]
    });

    res.status(200).json({ status: 'success', data: { skills } });
});

exports.getSkillOptions = catchAsync(async (req, res, next) => {
    const skills = await Skill.findAll({
        attributes: ['id', 'skill_name', 'deleted_at'],
        paranoid: false
    });


    const formattedSkills = skills.map(skill => ({
        id: skill.id,
        skill_name: skill.deleted_at ? `${skill.skill_name} (Archived)` : skill.skill_name
    }));

    res.status(200).json({ status: 'success', data: { skills: formattedSkills } });
});

exports.createSkill = catchAsync(async (req, res, next) => {
    const { skill_name, category, weight_employee, weight_manager } = req.body;

    if (!skill_name) {
        return next(new AppError('Skill name is required', 400));
    }


    if (weight_employee < 0 || weight_employee > 100) {
        return next(new AppError('Weight employee must be between 0 and 100', 400));
    }
    if (weight_manager < 0 || weight_manager > 100) {
        return next(new AppError('Weight manager must be between 0 and 100', 400));
    }

    const skill = await Skill.create({ skill_name, category, weight_employee, weight_manager });

    res.status(201).json({ status: 'success', data: { skill } });
});

exports.getQuestionsForSkill = catchAsync(async (req, res, next) => {
    const { skillId } = req.params;

    const questions = await Question.findAll({
        where: { skill_id: skillId, is_active: true },
        include: [{
            model: QuestionVersion,
            as: 'currentVersion'
        }]
    });

    res.status(200).json({ status: 'success', data: { questions } });
});

exports.addQuestionToSkill = catchAsync(async (req, res, next) => {
    const t = await Question.sequelize.transaction();
    try {
        const { skillId } = req.params;
        const { question_text, question_type } = req.body;

        if (!question_text) {
            await t.rollback();
            return next(new AppError('Question text is required', 400));
        }

        if (!['scale_1_10', 'yes_no'].includes(question_type)) {
            await t.rollback();
            return next(new AppError('Invalid question type. Must be scale_1_10 or yes_no', 400));
        }


        const question = await Question.create({ skill_id: skillId }, { transaction: t });


        const version = await QuestionVersion.create({
            question_id: question.id,
            question_text,
            question_type,
            version_number: 1
        }, { transaction: t });


        await question.update({ current_version_id: version.id }, { transaction: t });

        await t.commit();
        res.status(201).json({ status: 'success', data: { question, version } });
    } catch (err) {
        await t.rollback();
        return next(new AppError(err.message, 400));
    }
});

exports.updateQuestion = catchAsync(async (req, res, next) => {
    const t = await Question.sequelize.transaction();
    try {
        const { id } = req.params; // Question ID
        const { question_text, question_type } = req.body;

        const question = await Question.findByPk(id);
        if (!question) {
            await t.rollback();
            return next(new AppError('Question not found', 404));
        }


        const currentVerIdx = await QuestionVersion.findOne({
            where: { id: question.current_version_id }
        });
        const nextNum = (currentVerIdx ? currentVerIdx.version_number : 0) + 1;


        const newVersion = await QuestionVersion.create({
            question_id: id,
            question_text,
            question_type,
            version_number: nextNum
        }, { transaction: t });


        await question.update({ current_version_id: newVersion.id }, { transaction: t });

        await t.commit();
        res.status(200).json({ status: 'success', data: { version: newVersion } });
    } catch (err) {
        await t.rollback();
        return next(new AppError(err.message, 400));
    }
});

exports.getQuestionHistory = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const versions = await QuestionVersion.findAll({
        where: { question_id: id },
        order: [['version_number', 'DESC']]
    });

    res.status(200).json({ status: 'success', data: { versions } });
});

exports.deleteSkill = catchAsync(async (req, res, next) => {
    const t = await Skill.sequelize.transaction();
    try {
        const skill = await Skill.findByPk(req.params.id);
        if (!skill) {
            await t.rollback();
            return next(new AppError('Skill not found', 404));
        }


        await Question.destroy({
            where: { skill_id: skill.id },
            transaction: t
        });


        await skill.destroy({ transaction: t });

        await t.commit();
        res.status(200).json({ status: 'success', message: 'Skill and associated questions deleted' });
    } catch (err) {
        await t.rollback();
        return next(err);
    }
});

exports.deleteQuestion = catchAsync(async (req, res, next) => {
    const question = await Question.findByPk(req.params.id);
    if (!question) return next(new AppError('Question not found', 404));

    await question.destroy();
    res.status(200).json({ status: 'success', message: 'Question deleted' });
});
