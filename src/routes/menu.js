// routes/menuRoutes.js
const express = require("express");
const router = express.Router();
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });
const menu = require("../controllers/menuController");
const authToken = require("../middleware/authToken");

router.get("/categories", authToken, menu.getCategories);
router.post("/categories", authToken, menu.addCategory);


router.post("/items", authToken, upload.single("image"), menu.addMenuItem);
router.put("/items/:id", authToken, upload.single("image"), menu.updateMenuItem);
router.delete("/items/:id", authToken, menu.deleteMenuItem);


router.get('/top', menu.topProductAndOffers);
router.get('/search', menu.getMenus);

router.get('/:id', menu.getOneMenu);
module.exports = router;
