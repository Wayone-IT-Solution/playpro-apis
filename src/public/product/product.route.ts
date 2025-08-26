import { Router } from "express";
import { ProductController } from "../../public/product/product.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";
import {
  dynamicUpload,
  s3UploaderMiddleware,
} from "../../middlewares/s3FileUploadMiddleware";

const router = Router();

// ================== PRODUCT ROUTES ==================

// Create product (admin or user)
router.post(
  "/",
  authenticateToken,
  dynamicUpload([{ name: "image", maxCount: 1 }]), // 👈 single image
  s3UploaderMiddleware("product"), // 👈 upload to s3
  asyncHandler(ProductController.createProduct)
);

// Get all products (admin)
router.get(
  "/all",
  authenticateToken,
  asyncHandler(ProductController.getAllProducts)
);

// Get all public products
router.get("/public", asyncHandler(ProductController.getAllPublicProducts));

// Get product by ID
router.get("/:id", asyncHandler(ProductController.getProductById));

// Update product by ID
router.put(
  "/:id",
  authenticateToken,
  dynamicUpload([{ name: "image", maxCount: 1 }]), // 👈 allow update with single image
  s3UploaderMiddleware("product"),
  asyncHandler(ProductController.updateProductById)
);

// Delete product by ID
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(ProductController.deleteProductById)
);

export default router;
