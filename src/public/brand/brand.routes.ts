// modules/brand/brand.routes.ts
import { Router } from "express";
import { BrandController } from "./brand.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  dynamicUpload,
  s3UploaderMiddleware,
} from "../../middlewares/s3FileUploadMiddleware";

const router = Router();

// Public Routes
router.get("/public", asyncHandler(BrandController.getPublicBrands));
router.get("/:id", asyncHandler(BrandController.getBrandById));

// Admin Routes
router.post(
  "/",
  authenticateToken,
  dynamicUpload([{ name: "imageUrl", maxCount: 1 }]),
  s3UploaderMiddleware("brand"),
  asyncHandler(BrandController.createBrand)
);

router.put(
  "/:id",
  authenticateToken,
  dynamicUpload([{ name: "imageUrl", maxCount: 1 }]),
  s3UploaderMiddleware("brand"),
  asyncHandler(BrandController.updateBrand)
);

router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(BrandController.deleteBrand)
);
router.get("/", authenticateToken, asyncHandler(BrandController.getAllBrands));

export default router;
