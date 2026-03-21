const express = require('express');
const { postReviewStatus, getSallerReviews,addReview } = require('../controllers/reviewController');
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

router.post('/', authToken, addReview);
module.exports = router;
