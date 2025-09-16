import express from "express";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApplicationController } from "./application.controller";

const router = express.Router();

router.post("/", authenticateToken, asyncHandler(ApplicationController.createApplication));
router.get("/", authenticateToken, asyncHandler(ApplicationController.getAllApplications));
router.get("/:id", authenticateToken, asyncHandler(ApplicationController.getApplicationById));
// router.put("/:id/status", authenticateToken, asyncHandler(ApplicationController.updateApplicationStatus));

export default router;
