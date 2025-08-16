import express from "express";
import { GroundController } from "../groundOwner/ground.controller";
import { authenticateToken, isUser } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  dynamicUpload,
  s3UploaderMiddleware,
} from "../../middlewares/s3FileUploadMiddleware";

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  dynamicUpload([{ name: "images", maxCount: 5 }]),
  s3UploaderMiddleware("ground"),
  asyncHandler(GroundController.createGround)
);
router.post(
  "/admin",
  authenticateToken,
  dynamicUpload([{ name: "images", maxCount: 5 }]),
  s3UploaderMiddleware("ground"),
  asyncHandler(GroundController.createGroundByAdmin)
);
router.put(
  "/:id",
  authenticateToken,
  dynamicUpload([{ name: "images", maxCount: 5 }]),
  s3UploaderMiddleware("ground"),
  asyncHandler(GroundController.updateGround)
);
router.put(
  "/admin/:id",
  authenticateToken,
  dynamicUpload([{ name: "images", maxCount: 5 }]),
  s3UploaderMiddleware("ground"),
  asyncHandler(GroundController.updateGroundByAdmin)
);
router.get(
  "/search",
  authenticateToken,
  asyncHandler(GroundController.searchGrounds)
);
router.get(
  "/user",
  authenticateToken,
  asyncHandler(GroundController.getMyGrounds)
);
router.get(
  "/",
  authenticateToken,
  asyncHandler(GroundController.getAllPublicGround)
);
router.get("/public", asyncHandler(GroundController.getAllPublicGround));

router.get("/filter", asyncHandler(GroundController.getGroundFilters));
router.get("/public/:id", asyncHandler(GroundController.getGroundDetailsById));
router.get("/:id", asyncHandler(GroundController.getGroundById));
router.delete(
  "/image",
  authenticateToken,
  asyncHandler(GroundController.deleteImage)
);

export default router;
