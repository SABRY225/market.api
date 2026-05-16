const express = require('express');
const controller = require('../controllers/delivery.controller');
const router = express.Router();

router.post('/register', controller.register);
router.post('/login', controller.login);

router.get('/', controller.all);              // كل الدليفري
router.get('/:deliveryId', controller.get);   // دليفري واحد

router.get('/:deliveryId/status', controller.status);
router.put('/:deliveryId/status', controller.updateStatus);
router.get("/profile/:userId", controller.getProfile);

router.patch("/profile/:userId", controller.updateProfile);
router.put('/:deliveryId/location', controller.updateLocation);
router.put('/:deliveryId/online', controller.updateOnline);
router.get('/:deliveryId/notification', controller.notification);
// Statistics
router.post('/:requestId/accept', controller.acceptOrder);
router.get('/:deliveryId/myorders-pending', controller.getDeliveryOrders);
router.get('/:deliveryId/myorders-active', controller.myordersActive);
router.get('/:deliveryId/myorders-history', controller.myordersHistory);
router.get('/:deliveryId/myorders-stats', controller.getDeliveryStats);

router.patch('/:deliveryId/status-order',controller.changeStatusOrder)

module.exports = router;
