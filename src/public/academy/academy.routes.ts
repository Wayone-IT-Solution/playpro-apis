import express from "express";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { AcademyController } from "./academy.controller";

const academyRouter = express.Router();

academyRouter.post("/", authenticateToken, asyncHandler(AcademyController.createAcademy));
academyRouter.get("/", authenticateToken, asyncHandler(AcademyController.getAllAcademys));
academyRouter.get("/:id", authenticateToken, asyncHandler(AcademyController.getAcademyById));
// router.put("/:id/status", authenticateToken, asyncHandler(AcademyController.updateAcademyStatus));

export default academyRouter;
