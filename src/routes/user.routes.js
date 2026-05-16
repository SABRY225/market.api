const express = require('express');
const controller = require('../controllers/user.controller');
const preVerifyMiddleware = require('../middleware/preVerifyMiddleware');
const router = express.Router();

router.get('/get-vendor/:userId', controller.getVendorById);
router.post('/all-customers', preVerifyMiddleware, controller.allCustomers);
router.post('/all-vendors', preVerifyMiddleware, controller.allVendors);
router.post('/all-delivery', preVerifyMiddleware, controller.allDelivery);
router.put('/status/:userId', preVerifyMiddleware, controller.status);
router.post('/customer/:userId', preVerifyMiddleware, controller.getCustomer);
router.post('/vendor/:userId', preVerifyMiddleware, controller.getVendor);
router.post('/delivery/:userId', preVerifyMiddleware, controller.getDelivery);
module.exports = router;
