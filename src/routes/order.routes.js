const express = require('express');
const controller = require('../controllers/order.controller');
const preVerifyMiddleware = require('../middleware/preVerifyMiddleware');
const authToken = require('../middleware/authToken');
const router = express.Router();

router.post('/all', preVerifyMiddleware, controller.all);
router.get('/vendor',authToken, controller.getOrdersVendor);

router.get('/:orderId', controller.getOrderDetails);
router.patch('/:orderId/status', authToken, controller.updateOrderStatus);
router.patch('/:orderId/assign-delivery', authToken, controller.assignDelivery);

module.exports = router;
