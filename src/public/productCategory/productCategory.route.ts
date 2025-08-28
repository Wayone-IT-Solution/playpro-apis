import { Router } from "express";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { CategoryController } from "../../public/productCategory/productCategory.controller";

const router = Router();

/**
 * @route   GET /api/category/
 * @desc    Retrieve all categories (regardless of status)
 * @access  Admin (Authenticated)
 */
router.get("/", authenticateToken, CategoryController.getAllCategories);

/**
 * ===========================
 * 🔓 PUBLIC ROUTE
 * ===========================
 * @route   GET /api/category/public
 * @desc    Fetch all active (visible) categories for public view
 * @access  Public
 */
router.get("/public", CategoryController.getActiveCategories);

/**
 * @route   GET /api/category/parent/:parentId
 * @desc    Get all categories by parent ID
 * @access  Public
 */
router.get("/parent/:parentId", CategoryController.getCategoriesByParentId);

/**
 * ===========================
 * 🔐 ADMIN ROUTES (Protected)
 * ===========================
 */

/**
 * @route   POST /api/category/
 * @desc    Create a new category (name, parentCategory, description, seoMeta)
 * @access  Admin (Authenticated)
 */
router.post("/", authenticateToken, CategoryController.createCategory);

/**
 * @route   GET /api/category/:id
 * @desc    Get details of a specific category by ID
 * @access  Admin (Authenticated)
 */
router.get("/:id", authenticateToken, CategoryController.getCategoryById);

/**
 * @route   PATCH /api/category/:id
 * @desc    Update category (name, parentCategory, description, seoMeta)
 * @access  Admin (Authenticated)
 */
router.put("/:id", authenticateToken, CategoryController.updateCategory);

/**
 * @route   DELETE /api/category/:id
 * @desc    Permanently delete a category
 * @access  Admin (Authenticated)
 */
router.delete("/:id", authenticateToken, CategoryController.deleteCategory);

export default router;
