import { Router } from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "./blog.controller";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post("/", authenticateToken, isAdmin, asyncHandler(createBlog));
router.get("/", authenticateToken, asyncHandler(getAllBlogs));
router.get("/:id", authenticateToken, asyncHandler(getBlogById));
router.put("/:id", authenticateToken, isAdmin, asyncHandler(updateBlog));
router.delete("/:id", authenticateToken, isAdmin, asyncHandler(deleteBlog));

export default router;
