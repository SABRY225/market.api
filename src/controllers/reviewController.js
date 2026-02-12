const { Review, User, Menu } = require("../models");
const { fn, col } = require("sequelize");

exports.getSallerReviews = async (req, res) => {
  try {
    const vendorId = req.user.sub; // البائع من التوكن

    const reviews = await Review.findAll({
      attributes: ["id", "rating", "comment", "created_at"],
      include: [
        {
          model: Menu,
          as: "menu",
          attributes: ["id", "name"],
          where: { vendor_id: vendorId },
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const avgResult = await Review.findOne({
      attributes: [[fn("AVG", col("rating")), "avg_rating"]],
      include: [
        {
          model: Menu,
          as: "menu",
          where: { vendor_id: vendorId },
          attributes: [],
        },
      ],
      raw: true,
    });

    return res.json({
      average_rating: Number(avgResult.avg_rating || 0).toFixed(1),
      total_reviews: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};



exports.postReviewStatus = async (req, res) => {
  try {
    const vendorId = req.user.sub; // من JWT
    const { reviewId } = req.params;
    const { status } = req.body;

    const allowedStatus = ["approved", "rejected"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    // جلب الريفيو والتأكد إنه تابع لمنتج البائع
    const review = await Review.findOne({
      where: { id: reviewId },
      include: [
        {
          model: Menu,
          as: "menu",
          where: { vendor_id: vendorId },
        },
      ],
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.status = status;
    await review.save();

    return res.json({
      message: "Review status updated successfully",
      review_id: review.id,
      status: review.status,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
