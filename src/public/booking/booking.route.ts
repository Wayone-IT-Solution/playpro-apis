import express from "express";
import {
  createBooking,
  getAllBookings,
  getAllTransactions,
  getBookingById,
  rescheduleBooking,
  updateBooking,
} from "../../public/booking/booking.contoller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";

const router = express.Router();

// Create a booking
router.post("/", authenticateToken, asyncHandler(createBooking));
// Update booking by ID
router.put("/", authenticateToken, asyncHandler(updateBooking));
router.put("/reschedule", authenticateToken, asyncHandler(rescheduleBooking));
// In your route file
router.get(
  "/transactions/:status?",
  authenticateToken,
  asyncHandler(getAllTransactions)
);
router.get("/:status?", authenticateToken, asyncHandler(getAllBookings));
router.get("/:id", authenticateToken, asyncHandler(getBookingById));

// // Delete booking by ID
// router.delete("/:id", authenticateToken, asyncHandler(deleteBooking));

export default router;
