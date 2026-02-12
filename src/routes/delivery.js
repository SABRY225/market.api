const express = require('express');
const controller = require('../controllers/deliveryController');
const router = express.Router();

router.post('/:deliveryId/login', controller.login);
router.get('/:deliveryId', controller.get);
router.get('/:deliveryId/all', controller.all);
router.get('/:deliveryId/status', controller.status);
router.get('/:deliveryId/notification', controller.notification);
router.get('/:deliveryId/setting', controller.setting);
router.get('/:deliveryId/myorders', controller.myorders);

module.exports = router;
