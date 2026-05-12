// routes/advertisement.routes.js

const express = require("express");
const multer = require("multer");

const router = express.Router();

const advertisementController = require(
  "../controllers/advertisement.controller"
);

// multer memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
});

// ===============================
// Routes
// ===============================

// Get All
router.get(
  "/",
  advertisementController.getAdvertisements
);

// Get Active
router.get(
  "/active",
  advertisementController.getActiveAdvertisements
);

// Get Single
router.get(
  "/:id",
  advertisementController.getAdvertisementById
);

// Add
router.post(
  "/",
  upload.single("image"),
  advertisementController.addAdvertisement
);

// Update
router.put(
  "/:id",
  upload.single("image"),
  advertisementController.updateAdvertisement
);

// Activate
router.patch(
  "/active/:id",
  advertisementController.activeAdvertisement
);

// Deactivate
router.patch(
  "/disactive/:id",
  advertisementController.disActiveAdvertisement
);

// Increase Counter
router.patch(
  "/counter/:id",
  advertisementController.increaseClickCounter
);

// Delete
router.delete(
  "/:id",
  advertisementController.deleteAdvertisement
);

module.exports = router;