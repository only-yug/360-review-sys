const express = require('express');
const router = express.Router();
const adminExtrasController = require('../controllers/adminExtrasController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

// ==========================================
// TEAM CHANGE REQUESTS
// ==========================================
// User submits request
router.post('/teams/requests', adminExtrasController.createTransferRequest);
// User views their own requests
router.get('/teams/my-requests', adminExtrasController.getMyRequests); // [NEW]
// Admin views all requests
router.get('/teams/admin/requests', authorize('admin', 'manager'), adminExtrasController.getAllRequests);
// Admin approves/rejects
router.put('/teams/admin/requests/:id', authorize('admin', 'manager'), adminExtrasController.updateRequestStatus);

// ==========================================
// ANALYTICS
// ==========================================
router.get('/analytics/history/:userId', authorize('admin', 'manager'), adminExtrasController.getUserHistory);

module.exports = router;
