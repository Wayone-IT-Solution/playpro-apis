import express from "express";
import { CoachController } from "./coach.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { dynamicUpload, s3UploaderMiddleware } from "../../middlewares/s3FileUploadMiddleware";
const {
  createCoach,
  getCoachById,
  getAllCoachs,
  updateCoachById,
  deleteCoachById,
} = CoachController;

const router = express.Router();

router
  .get("/", authenticateToken, isAdmin, asyncHandler(getAllCoachs))
  .post("/",
    authenticateToken,
    isAdmin,
    dynamicUpload([{ name: "profileImage", maxCount: 1 }]),
    s3UploaderMiddleware("profile"),
    asyncHandler(createCoach))
  .get(
    "/:id",
    authenticateToken,
    isAdmin,
    asyncHandler(getCoachById)
  )
  .put(
    "/:id",
    authenticateToken,
    isAdmin,
    dynamicUpload([{ name: "profileImage", maxCount: 1 }]),
    s3UploaderMiddleware("profile"),
    asyncHandler(updateCoachById)
  )
  .delete(
    "/:id",
    authenticateToken,
    isAdmin,
    asyncHandler(deleteCoachById)
  );

export default router;
