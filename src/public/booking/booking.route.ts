import express from "express";
import {
  applyCoupon,
  removeCoupon,
  cancelBooking,
  createBooking,
  updateBooking,
  getAllBookings,
  getBookingById,
  getBookingUser,
  rescheduleBooking,
  getAllTransactions,
} from "../../public/booking/booking.contoller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";

const router = express.Router();

router.put("/", authenticateToken, asyncHandler(updateBooking));
router.get("/", authenticateToken, asyncHandler(getAllBookings));
router.post("/", authenticateToken, asyncHandler(createBooking));
router.post("/apply", authenticateToken, asyncHandler(applyCoupon));
router.put("/cancel", authenticateToken, asyncHandler(cancelBooking));
router.post("/remove", authenticateToken, asyncHandler(removeCoupon));
router.get("/users", authenticateToken, asyncHandler(getBookingUser));
router.put("/reschedule", authenticateToken, asyncHandler(rescheduleBooking));
router.get("/transactions", authenticateToken, asyncHandler(getAllTransactions));
router.get("/transactions/:id", authenticateToken, asyncHandler(getBookingById));

router.get("/:id", authenticateToken, asyncHandler(getBookingById));

export default router;
