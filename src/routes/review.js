const express = require('express');
const { postReviewStatus, getSallerReviews } = require('../controllers/reviewController');
const authToken = require('../middleware/authToken');
const router = express.Router();

router.patch("/:reviewId/status",
  authToken,
  postReviewStatus
);
router.get(
  "/",
  authToken,
  getSallerReviews
);
module.exports = router;
