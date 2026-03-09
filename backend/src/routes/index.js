const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const reviewCycleRoutes = require('./reviewCycleRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const skillRoutes = require('./skillRoutes');
const scoreRoutes = require('./scoreRoutes');
const adminExtrasRoutes = require('./adminExtrasRoutes');
const adminDashboardRoutes = require('./adminDashboardRoutes');
// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/review-cycles', reviewCycleRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/admin/skills', skillRoutes);
router.use('/scores',scoreRoutes );
router.use('/extras',adminExtrasRoutes);
router.use('/admin',adminDashboardRoutes);
module.exports = router;
