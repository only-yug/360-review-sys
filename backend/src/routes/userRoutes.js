const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/create', authorize('admin'), userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/me/team', userController.getMyTeam); // [NEW]
router.get('/me/manager', userController.getMyManager); // [NEW]
router.get('/:id', userController.getUserById);

// Admin / Manager actions
router.put('/:id/role', authorize('admin'), userController.updateUserRole);
router.post('/:id/assign-manager', authorize('admin'), userController.assignManager);
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;
