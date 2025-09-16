import express from "express";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { ProgressController } from "./progress.controller";

const router = express.Router();

router.post("/", authenticateToken, asyncHandler(ProgressController.createProgress));
router.get("/", authenticateToken, asyncHandler(ProgressController.getAllProgress));
// router.get("/:id", authenticateToken, asyncHandler(ProgressController.getProgressById));
router.put("/:id", authenticateToken, asyncHandler(ProgressController.updateProgress));

export default router;
