import express from "express";
import { BannerController } from "./banner.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { dynamicUpload, s3UploaderMiddleware } from "../../middlewares/s3FileUploadMiddleware";

const {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBannerById,
  deleteBannerById,
} = BannerController;

const router = express.Router();

router
  .get("/", authenticateToken, asyncHandler(getAllBanners))
  .post("/",
    authenticateToken,
    dynamicUpload([{ name: "image", maxCount: 1 }]),
    s3UploaderMiddleware("banner"),
    asyncHandler(createBanner))
  .get("/:id", authenticateToken, asyncHandler(getBannerById))
  .put("/:id",
    authenticateToken,
    dynamicUpload([{ name: "image", maxCount: 1 }]),
    s3UploaderMiddleware("banner"),
    asyncHandler(updateBannerById))
  .delete("/:id", authenticateToken, asyncHandler(deleteBannerById));

export default router;
