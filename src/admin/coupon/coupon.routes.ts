import express from "express";
import { CouponController } from "./coupon.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
const {
  createCoupon,
  getCouponById,
  getAllCoupons,
  updateCouponById,
  deleteCouponById,
  getAllPublicCoupons
} = CouponController;

const router = express.Router();

router
  .get("/", authenticateToken, isAdmin, asyncHandler(getAllCoupons))
  .post("/", authenticateToken, isAdmin, asyncHandler(createCoupon))
  .get("/public", authenticateToken, asyncHandler(getAllPublicCoupons))
  .get(
    "/:id",
    authenticateToken,
    isAdmin,
    asyncHandler(getCouponById)
  )
  .put(
    "/:id",
    authenticateToken,
    isAdmin,
    asyncHandler(updateCouponById)
  )
  .delete(
    "/:id",
    authenticateToken,
    isAdmin,
    asyncHandler(deleteCouponById)
  );

export default router;
