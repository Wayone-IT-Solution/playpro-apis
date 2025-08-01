import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  getYearlyRevenue,
  getDashboardStats,
} from "../controller/revenue.controller";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticateToken, isAdmin, asyncHandler(getYearlyRevenue));
router.get(
  "/stats",
  authenticateToken,
  isAdmin,
  asyncHandler(getDashboardStats)
);

export default router;
