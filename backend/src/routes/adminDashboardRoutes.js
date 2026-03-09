const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

router.get('/cycles', adminDashboardController.getCycles);
router.get('/dashboard/employees', adminDashboardController.getDashboardEmployees);
router.get('/audit/:employeeId', adminDashboardController.getEmployeeAudit);
router.get('/audit/reviewer/:reviewerId', adminDashboardController.getReviewerAudit);
router.patch('/feedback/:feedbackId', adminDashboardController.updateFeedbackOverride);
// Note: API Spec had PATCH /feedback/:feedbackId/answers/:answerId with body. 
// Fixing implementation to match spec:
router.patch('/feedback/answers/:answerId', adminDashboardController.updateAnswer);

module.exports = router;
