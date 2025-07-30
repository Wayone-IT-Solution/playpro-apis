import { Router } from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog
} from "./blog.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post("/", authenticateToken, asyncHandler(createBlog));
router.get("/", asyncHandler(getAllBlogs));
router.get("/:id", asyncHandler(getBlogById));
router.put("/:id", authenticateToken,  asyncHandler(updateBlog));
router.delete("/:id", authenticateToken,  asyncHandler(deleteBlog));

export default router;
