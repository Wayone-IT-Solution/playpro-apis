import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../category/category.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/", authenticateToken, asyncHandler(createCategory));
router.get("/", authenticateToken, asyncHandler(getAllCategories));
router.get("/:id", authenticateToken, asyncHandler(getCategoryById));
router.put("/:id", authenticateToken, asyncHandler(updateCategory));
router.delete("/:id", authenticateToken, asyncHandler(deleteCategory));

export default router;
