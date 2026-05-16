// routes/sellerReports.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/sellerReports.controller");
const authToken = require("../middleware/authToken");

router.get("/", authToken, controller.getReports);

module.exports = router;
