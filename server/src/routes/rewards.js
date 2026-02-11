const express = require('express');
const router = express.Router();
const rewardsController = require('../controllers/rewardsController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

router.post('/submit-bottle', rewardsController.submitBottle);
router.post('/redeem', rewardsController.redeemItem);
router.get('/redemption-history', rewardsController.getRedemptionHistory);
router.get('/bottle-history', rewardsController.getBottleHistory);

module.exports = router;
