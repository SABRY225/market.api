const express = require('express');
const OrderMartController = require('../controllers/mart/orderMart.controller');
const router = express.Router();

// Main management tracks
router.route('/')
  .get(OrderMartController.getAllOrders)
  .post(OrderMartController.createOrder);

router.route('/:id')
  .get(OrderMartController.getOrderById)
  .put(OrderMartController.updateOrder)
  .delete(OrderMartController.deleteOrder);

module.exports = router;