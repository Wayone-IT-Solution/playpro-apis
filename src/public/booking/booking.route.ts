import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  rescheduleBooking,
  updateBooking,
} from "../../public/booking/booking.contoller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";

const router = express.Router();

// Create a booking
router.post("/", authenticateToken, asyncHandler(createBooking));

// // Get all bookings
router.get("/:status?", authenticateToken, asyncHandler(getAllBookings));

// // Get booking by ID
router.get("/:id", authenticateToken, asyncHandler(getBookingById));

// Update booking by ID
router.put("/", authenticateToken, asyncHandler(updateBooking));
router.put("/reschedule", authenticateToken, asyncHandler(rescheduleBooking));

// // Delete booking by ID
// router.delete("/:id", authenticateToken, asyncHandler(deleteBooking));

export default router;
