import { Router } from "express";
import {
  createReview,
  deleteReviewByIdAdmin,
  getAllReviewsAdmin,
  getReviewByIdAdmin,
  getReviewsByGround,
} from "../../public/review/review.controller";

import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken} from "../../middlewares/authMiddleware";
// import { isAdmin } from "../../middlewares/authMiddleware";

const router = Router();

// ✅ Submit a review (only after booking)
router.post("/", authenticateToken, createReview);

// ✅ Get all reviews for a specific ground
router.get("/:groundId", getReviewsByGround);

router.get(
  "/",
  authenticateToken,
//   isAdmin,
  getAllReviewsAdmin
);
// router.get(
//   "/admin/:id",
//   authenticateToken,
// //   isAdmin,
//   getReviewByIdAdmin
// );
router.delete(
  "/:id",
  authenticateToken,
//   isAdmin,
  deleteReviewByIdAdmin
);

export default router;
