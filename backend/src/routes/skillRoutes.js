const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// ==========================================
// SKILLS ROUTES
// ==========================================
// Base: /admin/skills (mounted in index.js)

// Public (Authenticated) Options
router.get('/options', skillController.getSkillOptions);

// Skills
router.get('/', authorize('admin'), skillController.getAllSkills);
router.post('/', authorize('admin'), skillController.createSkill);
router.delete('/:id', authorize('admin'), skillController.deleteSkill);

// Questions
router.get('/:skillId/questions', authorize('admin'), skillController.getQuestionsForSkill);
router.post('/:skillId/questions', authorize('admin'), skillController.addQuestionToSkill);

// Question Updates (Versioning)
router.put('/questions/:id', authorize('admin'), skillController.updateQuestion);
router.get('/questions/:id/history', authorize('admin'), skillController.getQuestionHistory);
router.delete('/questions/:id', authorize('admin'), skillController.deleteQuestion);

module.exports = router;
