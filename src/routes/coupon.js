const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/couponController');
const authToken = require('../middleware/authToken');
const router = express.Router();

router.get('/all', controller.all);
router.get('/vendor',authToken, controller.fetchSallerPromotions);
router.post('/add',authToken, body('code').trim().notEmpty(), body('discount').isFloat({ min: 0 }), controller.add);
router.delete('/remove/:couponId',authToken, controller.remove);

module.exports = router;
