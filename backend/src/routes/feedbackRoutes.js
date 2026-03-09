const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const feedbackController = require('../controllers/feedbackController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// List my pending reviews (as reviewer)
router.get('/pending', feedbackController.getMyPendingReviews);

// Review Status Dashboard (Pending vs Completed)
router.get('/status', feedbackController.getReviewStatus);

// Review Interface
router.get('/:id', feedbackController.getReviewInterface);

// Submit Review
// Validation rules
const submitReviewValidation = [
  body('answers').optional().isArray().withMessage('Answers must be an array'),
  body('answers.*.questionId').optional().isInt().withMessage('Question ID must be an integer'),
  body('answers.*.score').optional().isInt({ min: 0, max: 10 }).withMessage('Score must be between 0 and 10'),
  body('comments').optional().isArray().withMessage('Comments must be an array'),
  body('comments.*.skillId').optional().isInt(),
  body('comments.*.comment').optional().isString()
];

router.post('/:id/submit', submitReviewValidation, validate, feedbackController.submitReview);

// View Received Feedback (as reviewee)
// router.get('/my', feedbackController.getMyFeedback);

module.exports = router;
