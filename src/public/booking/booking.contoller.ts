import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware";
import { Booking } from "../../modals/booking.model";
import { Ground } from "../../modals/groundOwner.model";
import { Slot } from "../../modals/slot.model";
import ApiError from "../../utils/ApiError";
import mongoose from "mongoose";
import ApiResponse from "../../utils/ApiResponse";
import { CommonService } from "../../services/common.services";
import { User } from "../../modals/user.model";

const bookingService = new CommonService(Booking);

export const createBooking = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const {
      groundId,
      slots = [],
      numberOfGuests,
      emergencyContact = {},
    } = req.body;

    // 🔒 Validate required fields
    if (!groundId || !slots.length || !numberOfGuests) {
      throw new ApiError(400, "Missing required fields");
    }

    // 📦 Fetch ground
    const groundData = await Ground.findById({
      _id: groundId,
      status: "active",
    }).lean();

    if (!groundData) {
      throw new ApiError(404, "Ground not found");
    }

    const groundAmount = groundData.pricePerHour || 0;

    // 🎯 Convert slots to ObjectId[]
    const objectSlotIds = slots.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    );

    // ✅ Step 1: Get matching available timeslots
    const result = await Slot.aggregate([
      {
        $match: { groundId: new mongoose.Types.ObjectId(groundId) },
      },
      {
        $project: {
          groundId: 1,
          timeslots: {
            $filter: {
              input: "$timeslots",
              as: "slot",
              cond: {
                $and: [
                  { $in: ["$$slot._id", objectSlotIds] },
                  { $eq: ["$$slot.isBooked", false] },
                  { $eq: ["$$slot.bookedBy", null] },
                ],
              },
            },
          },
        },
      },
    ]);

    // ❌ Step 2: Validate all slots are valid and available
    if (!result.length || result[0].timeslots.length !== slots.length) {
      return res
        .status(400)
        .json(
          new ApiError(
            400,
            "Some provided slot IDs are invalid or already booked"
          )
        );
    }

    const groundSlotDoc = result[0];
    const filteredSlots = groundSlotDoc.timeslots;

    // 💰 Step 3: Calculate total amount
    let totalAmount = 0;
    filteredSlots.forEach((slot: any) => {
      const slotAmount = slot?.amount ?? groundAmount;
      totalAmount += slotAmount;
    });

    const paymentId = `PAY_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // 🟩 Step 4: Mark each slot as booked
    for (const slotId of slots) {
      await Slot.updateOne(
        { "timeslots._id": slotId },
        {
          $set: {
            "timeslots.$.isBooked": true,
            "timeslots.$.bookedBy": userId,
          },
        }
      );
    }

    // 📌 Step 5: Create Booking
    const booking = await Booking.create({
      userId,
      slots,
      groundId,
      totalAmount,
      numberOfGuests,
      emergencyContact,
      finalAmount: totalAmount,
    });

    return res.status(200).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const updateBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, orderId, paymentDetails } = req.body;

    if (status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment not successful",
      });
    }

    // 1. Fetch booking
    const booking = await Booking.findById(orderId);

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    if (booking.paymentStatus === "paid") {
      return res.status(409).json({
        success: false,
        message: "Booking already completed",
      });
    }

    const slotIds = booking.slots;
    const userId = booking.userId;
    const user = await User.findById(userId);
    const ground = await Ground.findById(booking.groundId);
    // 🎯 Convert slots to ObjectId[]
    const objectSlotIds = slotIds.map(
      (id: any) => new mongoose.Types.ObjectId(id)
    );

    const result = await Slot.aggregate([
      {
        $match: { groundId: new mongoose.Types.ObjectId(booking.groundId) },
      },
      {
        $project: {
          groundId: 1,
          timeslots: {
            $filter: {
              input: "$timeslots",
              as: "slot",
              cond: {
                $and: [{ $in: ["$$slot._id", objectSlotIds] }],
              },
            },
          },
        },
      },
    ]);

    const meta = {
      user,
      ground,
      slots: result?.[0]?.timeslots,
    };

    // 4. Update booking
    booking.meta = meta;
    booking.paymentDetails = paymentDetails;
    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking finalized after payment",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};
export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId)
      .populate("userId", "firstName lastName email")
      .populate("slots")
      .populate("groundId", "name location");

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, booking, "Booking fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookings = await bookingService.getAll(req.query);
    return res.status(200).json({
      success: true,
      message: "All bookings fetched successfully",
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const rescheduleBooking = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { bookingId, newSlotIds = [] } = req.body;

    if (!bookingId || !newSlotIds.length) {
      throw new ApiError(400, "Booking ID and new slot IDs are required");
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    // ✅ Free previous slots
    for (const slotId of booking.slots) {
      await Slot.updateOne(
        { "timeslots._id": slotId },
        {
          $set: {
            "timeslots.$.isBooked": false,
            "timeslots.$.bookedBy": null,
          },
        }
      );
    }

    // ✅ Check if all new slots are available
    const objectSlotIds = newSlotIds.map(
      (id: any) => new mongoose.Types.ObjectId(id)
    );

    const result = await Slot.aggregate([
      {
        $match: { groundId: new mongoose.Types.ObjectId(booking.groundId) },
      },
      {
        $project: {
          groundId: 1,
          timeslots: {
            $filter: {
              input: "$timeslots",
              as: "slot",
              cond: {
                $and: [
                  { $in: ["$$slot._id", objectSlotIds] },
                  { $eq: ["$$slot.isBooked", false] },
                ],
              },
            },
          },
        },
      },
    ]);

    if (!result.length || result[0].timeslots.length !== newSlotIds.length) {
      throw new ApiError(400, "Some new slots are already booked or invalid");
    }

    // ✅ Mark new slots as booked
    for (const slotId of newSlotIds) {
      await Slot.updateOne(
        { "timeslots._id": slotId },
        {
          $set: {
            "timeslots.$.isBooked": true,
            "timeslots.$.bookedBy": userId,
          },
        }
      );
    }

    const user = await User.findById(userId);
    const ground = await Ground.findById(booking.groundId);

    const objectSlotIds2 = newSlotIds.map(
      (id: any) => new mongoose.Types.ObjectId(id)
    );

    const results = await Slot.aggregate([
      {
        $match: { groundId: new mongoose.Types.ObjectId(booking.groundId) },
      },
      {
        $project: {
          groundId: 1,
          timeslots: {
            $filter: {
              input: "$timeslots",
              as: "slot",
              cond: {
                $and: [{ $in: ["$$slot._id", objectSlotIds2] }],
              },
            },
          },
        },
      },
    ]);

    const meta = {
      user,
      ground,
      slots: results?.[0]?.timeslots,
    };

    booking.slots = newSlotIds;
    booking.status = "rescheduled";
    booking.rescheduled = true;
    booking.meta = meta;

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking rescheduled successfully",
      data: booking,
    });
  } catch (err) {
    console.error("❌ Error in rescheduleBooking:", err);
    next(err);
  }
};
