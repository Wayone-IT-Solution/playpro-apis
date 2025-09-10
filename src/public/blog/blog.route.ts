import { Router } from "express";
import {
  updateBlog,
  deleteBlog,
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  getAllPublicBlogs
} from "./blog.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import {
  dynamicUpload,
  s3UploaderMiddleware,
} from "../../middlewares/s3FileUploadMiddleware";

const router = Router();

router.post(
  "/",
  authenticateToken,
  isAdmin,
  dynamicUpload([{ name: "imageUrl", maxCount: 1 }]),
  s3UploaderMiddleware("banner"),
  asyncHandler(createBlog)
);
router.get("/", authenticateToken, asyncHandler(getAllBlogs));
router.get("/public", asyncHandler(getAllPublicBlogs));
router.get("/public/:slug", asyncHandler(getBlogBySlug));
router.get("/:id", authenticateToken, asyncHandler(getBlogById));
router.put(
  "/:id",
  authenticateToken,
  isAdmin,
  dynamicUpload([{ name: "imageUrl", maxCount: 1 }]),
  s3UploaderMiddleware("banner"),
  asyncHandler(updateBlog)
);
router.delete("/:id", authenticateToken, isAdmin, asyncHandler(deleteBlog));

export default router;
