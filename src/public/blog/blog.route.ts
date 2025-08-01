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
