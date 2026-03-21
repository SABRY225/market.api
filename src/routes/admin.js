const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const preVerifyMiddleware = require('../middleware/preVerifyMiddleware');
const authToken = require('../middleware/authToken');

const router = express.Router();

// Register a new admin account
router.post('/register',
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail(),
  adminController.register
);

router.post('/login',
  body('email').isEmail(),
  adminController.login
);

router.post('/send-code',
  body('token').notEmpty(),
  adminController.sendCode
);

router.post('/verify-code',
  body('token').notEmpty(),
  body('code').isLength({ min: 5, max: 5 }).isNumeric(),
  adminController.verifyCode
);

// Admin statistics
router.post('/statistics',preVerifyMiddleware , adminController.statistics);
router.post('/',body('token').notEmpty(), adminController.getadminInfo);
router.get('/orders/:userId', adminController.getUserOrders);
router.get('/delivery/:deliveryId', adminController.getDelivery);
router.get('/orders-delivery/:deliveryId', adminController.getDeliveryOrders);

// System endpoints
router.get('/system/general', adminController.systemGeneral);
router.get('/system/regions-shipping', adminController.regionsShipping);
router.post('/stock',preVerifyMiddleware , adminController.linkingStock);
  
// Notifications
router.post('/notification', adminController.notifications);

router.get("/all", authToken, adminController.getAllAdmins);
router.post("/add", authToken, adminController.createAdmin);
router.put("/:id", authToken, adminController.updateAdmin);
router.delete("/:id", authToken, adminController.deleteAdmin);
module.exports = router;

