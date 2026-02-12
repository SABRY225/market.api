const express = require('express');
const controller = require('../controllers/orderController');
const preVerifyMiddleware = require('../middleware/preVerifyMiddleware');
const authToken = require('../middleware/authToken');
const router = express.Router();

router.post('/all', preVerifyMiddleware, controller.all);
router.put('/status/:orderId', authToken, controller.status);
router.get('/vendor',authToken, controller.getOrdersVendor);
router.get('/:orderId', controller.get);

module.exports = router;
