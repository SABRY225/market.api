const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewards.controller');

router.get('/', rewardController.getAllRewards);

router.patch('/:id/points', rewardController.updateRewardPoints);

module.exports = router;