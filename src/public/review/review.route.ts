import { Router } from "express";
import {
  createReview,
  getAllReviewsAdmin,
  getReviewByIdAdmin,
  deleteReviewByIdAdmin,
  updateStatus,
} from "../../public/review/review.controller";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/", authenticateToken, createReview);
router.get("/", authenticateToken, isAdmin, getAllReviewsAdmin);
router.get("/:id", authenticateToken, isAdmin, getReviewByIdAdmin);
router.delete("/:id", authenticateToken, isAdmin, deleteReviewByIdAdmin);
router.patch("/:id", authenticateToken, isAdmin, updateStatus);

export default router;
