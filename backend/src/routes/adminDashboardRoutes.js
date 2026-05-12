const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const dashboardSummaryController = require('../controllers/dashboardSummaryController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// All routes require authentication
router.use(authenticate);

// Summary endpoint is accessible to ALL authenticated roles (admin, manager, employee)
// Role-specific filtering is handled inside the controller
router.get('/dashboard/summary', dashboardSummaryController.getSummary);

// All routes below require admin role
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
