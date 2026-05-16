const express = require('express');
const controller = require('../controllers/payment.controller');
const router = express.Router();

router.post('/statistics', controller.statistics);
router.post('/invoices', controller.invoices);
router.post('/vendor-withdrawal-requests', controller.vendorWithdrawalRequests);
router.post('/vendor-withdrawal-requests/:id/decision', controller.vendorWithdrawalDecision);

module.exports = router;
