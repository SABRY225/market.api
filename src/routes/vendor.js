const express = require('express');
const controller = require('../controllers/vendorController');
const authToken = require('../middleware/authToken');
const router = express.Router();

router.post('/login', controller.login);
router.post('/send-code', controller.sendCode);
router.post('/verify-code', controller.verifyCode);

router.get('/',authToken,controller.getVendorInfo);
router.get('/statistics',authToken,controller.vendorStatistics);
router.get('/overview/notifictions',authToken,controller.notifications);


router.get('/all', controller.all);
router.put('/status/:vendorId', controller.status);
router.get('/:vendorId', controller.get);

module.exports = router;
