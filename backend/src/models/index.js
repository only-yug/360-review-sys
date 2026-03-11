const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/sequelize');

// Import Models
const User = require('./User')(sequelize);
const ReportingLine = require('./ReportingLine')(sequelize);
const TeamChangeRequest = require('./TeamChangeRequest')(sequelize);
const EvaluationCycle = require('./EvaluationCycle')(sequelize);
const Skill = require('./Skill')(sequelize);
const Question = require('./Question')(sequelize);
const QuestionVersion = require('./QuestionVersion')(sequelize);
const Review = require('./Review')(sequelize);
const ReviewAnswer = require('./ReviewAnswer')(sequelize);
const ReviewSkillFeedback = require('./ReviewSkillFeedback')(sequelize);
const UserSkillScore = require('./UserSkillScore')(sequelize);
const FinalScore = require('./FinalScore')(sequelize);

// ==========================================
// ASSOCIATIONS
// ==========================================

// 1. Users & Reporting
User.hasMany(ReportingLine, { foreignKey: 'employee_id', as: 'managedBy' });
User.hasMany(ReportingLine, { foreignKey: 'manager_id', as: 'manages' });
ReportingLine.belongsTo(User, { foreignKey: 'employee_id', as: 'employee' });
ReportingLine.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

User.hasMany(TeamChangeRequest, { foreignKey: 'employee_id' });
User.hasMany(TeamChangeRequest, { foreignKey: 'current_manager_id' });
User.hasMany(TeamChangeRequest, { foreignKey: 'target_manager_id' });
TeamChangeRequest.belongsTo(User, { foreignKey: 'employee_id', as: 'employee' });
TeamChangeRequest.belongsTo(User, { foreignKey: 'current_manager_id', as: 'currentManager' });
TeamChangeRequest.belongsTo(User, { foreignKey: 'target_manager_id', as: 'targetManager' });

// 2. Skills & Questions
Skill.hasMany(Question, { foreignKey: 'skill_id', as: 'questions' });
Question.belongsTo(Skill, { foreignKey: 'skill_id', as: 'skill' });

Question.hasMany(QuestionVersion, { foreignKey: 'question_id', as: 'versions' });
QuestionVersion.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// Special Association for 'current_version'
Question.belongsTo(QuestionVersion, { foreignKey: 'current_version_id', as: 'currentVersion' });

// 3. Reviews
EvaluationCycle.hasMany(Review, { foreignKey: 'cycle_id' });
Review.belongsTo(EvaluationCycle, { foreignKey: 'cycle_id' });

User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'reviewsGiven' });
User.hasMany(Review, { foreignKey: 'reviewee_id', as: 'reviewsReceived' });
Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'reviewee_id', as: 'reviewee' });

Review.hasMany(ReviewAnswer, { foreignKey: 'review_id', as: 'answers' });
ReviewAnswer.belongsTo(Review, { foreignKey: 'review_id' });
ReviewAnswer.belongsTo(QuestionVersion, { foreignKey: 'question_version_id', as: 'questionVersion' });

Review.hasMany(ReviewSkillFeedback, { foreignKey: 'review_id', as: 'feedback' });
ReviewSkillFeedback.belongsTo(Review, { foreignKey: 'review_id' });
ReviewSkillFeedback.belongsTo(Skill, { foreignKey: 'skill_id', as: 'skill' });

// 4. Scores
EvaluationCycle.hasMany(UserSkillScore, { foreignKey: 'cycle_id' });
UserSkillScore.belongsTo(EvaluationCycle, { foreignKey: 'cycle_id' });
User.hasMany(UserSkillScore, { foreignKey: 'user_id' });
UserSkillScore.belongsTo(User, { foreignKey: 'user_id' });
Skill.hasMany(UserSkillScore, { foreignKey: 'skill_id' });
UserSkillScore.belongsTo(Skill, { foreignKey: 'skill_id' });

EvaluationCycle.hasMany(FinalScore, { foreignKey: 'cycle_id' });
FinalScore.belongsTo(EvaluationCycle, { foreignKey: 'cycle_id' });
User.hasMany(FinalScore, { foreignKey: 'user_id' });
FinalScore.belongsTo(User, { foreignKey: 'user_id' });

const db = {
  sequelize,
  Sequelize,
  User,
  ReportingLine,
  TeamChangeRequest,
  EvaluationCycle,
  Skill,
  Question,
  QuestionVersion,
  Review,
  ReviewAnswer,
  ReviewSkillFeedback,
  UserSkillScore,
  FinalScore,
};

module.exports = db;
