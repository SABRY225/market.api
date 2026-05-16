const express = require('express');
const controller = require('../controllers/analytics.controller');
const preVerifyMiddleware = require('../middleware/preVerifyMiddleware');
const router = express.Router();

router.post('/statistics', preVerifyMiddleware,controller.statistics);
router.post('/monthly-sales',preVerifyMiddleware, controller.monthlySales);
router.post('/active-users', preVerifyMiddleware, controller.activeUsers);
router.post('/most-viewed-products', preVerifyMiddleware, controller.mostSoldProducts);
router.post('/platform-monthly-profits', preVerifyMiddleware, controller.platformMonthlyProfits);

module.exports = router;
