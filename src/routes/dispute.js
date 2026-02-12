const express = require('express');
const controller = require('../controllers/disputeController');
const router = express.Router();

router.get('/all', controller.all);
router.get('/vender', controller.getSallerTickets);
router.post('/create', controller.create);
router.post('/reply/:disputeId', controller.reply);
router.put('/status/:disputeId', controller.status);

module.exports = router;
