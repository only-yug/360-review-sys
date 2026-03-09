const express = require('express');
const scoreController = require('../controllers/scoreController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Routes
router.get('/top-overall', scoreController.getTopOverallOrder);
router.get('/top-skills', scoreController.getTopSkillScorers);
router.get('/history/:userId?', scoreController.getScoreHistory);
router.get('/distribution/:userId?', scoreController.getLatestSkillDistribution);

module.exports = router;
