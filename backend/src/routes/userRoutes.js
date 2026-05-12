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
router.get('/minimal/list', userController.getMinimalUsers);
router.get('/me/team', userController.getMyTeam); // [NEW]
router.get('/me/manager', userController.getMyManager); // [NEW]
router.get('/:id', userController.getUserById);

// Admin / Manager actions
router.put('/:id/update', authorize('admin'), userController.updateUser);
router.put('/:id/role', authorize('admin'), userController.updateUserRole);
router.post('/:id/assign-manager', authorize('admin'), userController.assignManager);
router.post('/:id/add-manager', authorize('admin'), userController.addManager);
router.delete('/:employeeId/remove-manager/:managerId', authorize('admin'), userController.removeManager);
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;
