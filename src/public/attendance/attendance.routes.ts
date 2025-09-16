import express from "express";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { AttendanceController } from "./attendance.controller";

const router = express.Router();

router.post("/", authenticateToken, asyncHandler(AttendanceController.markAttendance));
// router.get("/", authenticateToken, asyncHandler(AttendanceController.getAllAttendance));
// router.get("/:id", authenticateToken, asyncHandler(AttendanceController.getAttendanceById));

export default router;
