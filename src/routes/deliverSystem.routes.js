const express = require('express');
const router = express.Router();
const deliverCtrl = require('../controllers/deliverySystem.controller');

router.get('/', deliverCtrl.getDeliverSystem);
router.patch('/', deliverCtrl.updateDeliverSystem);

module.exports = router;