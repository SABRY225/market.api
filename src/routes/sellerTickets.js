// routes/sellerTickets.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/sellerTicketController");
const authToken = require("../middleware/authToken");

router.get("/vendor", authToken, controller.getSellerTickets);
router.post("/", authToken, controller.createSellerTicket);

module.exports = router;
