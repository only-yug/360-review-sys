const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const reviewCycleController = require('../controllers/reviewCycleController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

// Validation rules
const createCycleValidation = [
  body('cycle_name').notEmpty().withMessage('Name is required')
];

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', reviewCycleController.getAllCycles);
router.get('/:id', reviewCycleController.getCycleById);

// Routes requiring authorization logic specific to cycles are below
router.post('/', authorize('admin'), createCycleValidation, validate, reviewCycleController.createCycle);
router.put('/:id', authorize('admin'), reviewCycleController.updateCycle);

// Start cycle and generate reviews
router.post('/:id/start', authorize('admin'), reviewCycleController.startCycle);

router.delete('/:id', authorize('admin'), reviewCycleController.deleteCycle);



module.exports = router;
