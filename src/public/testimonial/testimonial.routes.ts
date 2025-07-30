import { Router } from "express";
import {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
} from "../testimonial/testimonial.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post("/", authenticateToken, asyncHandler(createTestimonial));
router.get("/", asyncHandler(getAllTestimonials));
router.get("/:id",asyncHandler( getTestimonialById));
router.put("/:id", authenticateToken,asyncHandler( updateTestimonial));
router.delete("/:id", authenticateToken,asyncHandler( deleteTestimonial));
export default router;
