const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/authController');
const multer = require('multer');
const authToken = require('../middleware/authToken');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post(
  '/register',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  body('email').isEmail().normalizeEmail(),
  controller.register
);

router.put(
  '/vendor/profile/:id',
  authToken,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  controller.updateVendorProfile
);

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  controller.login
);

module.exports = router;
