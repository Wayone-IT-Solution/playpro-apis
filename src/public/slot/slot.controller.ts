import mongoose from "mongoose";
import { Request, Response } from "express";
import ApiError from "../../utils/ApiError";
import { addDays, startOfDay } from "date-fns";
import ApiResponse from "../../utils/ApiResponse";
import { Slot, TimeSlot } from "../../modals/slot.model";
import { Ground } from "../../modals/groundOwner.model";

export const createSlots = async (request: Request, response: Response) => {
  const { dates, timeslots, groundId } = request.body;

  if (!dates || !groundId || !timeslots) {
    return response.status(400).json(new ApiError(400, "All fields are required"));
  }

  const groundExists = await Ground.findById(groundId);
  if (!groundExists) {
    return response.status(400).json(new ApiError(400, "Ground doesn't exist!"));
  }

  const timeslotsArray: any = [];

  dates.forEach((date: any) => {
    timeslots.forEach((slot: any) => {
      timeslotsArray.push(
        new TimeSlot({
          date,
          bookedBy: null,
          isBooked: false,
          endTime: slot.endTime,
          startTime: slot.startTime,
        })
      );
    });
  });

  let savedSlots;
  const groundSlotExist = await Slot.findOne({ groundId });
  if (groundSlotExist) {
    savedSlots = await Slot.updateOne(
      { groundId },
      { $push: { timeslots: { $each: timeslotsArray } } }
    );
  } else {
    const slotDocument = {
      groundId,
      timeslots: timeslotsArray,
    };
    const slot = new Slot(slotDocument);
    savedSlots = await slot.save();
  }

  return response.status(200).json(new ApiResponse(200, savedSlots, "Slots created successfully"));
};

export const getNextDaysSlots = async (request: Request, response: Response) => {
  try {
    const groundId = request.params.id;
    if (!groundId) {
      return response.status(400).json(new ApiError(400, "Ground ID is required"));
    }

    const groundExists = await Ground.findById(groundId);
    if (!groundExists) {
      return response.status(400).json(new ApiError(400, "Ground doesn't exist!"));
    }

    const today = startOfDay(new Date());
    const nextDays = addDays(today, 30);

    const slots = await Slot.aggregate([
      {
        $match: {
          groundId: new mongoose.Types.ObjectId(groundId),
          "timeslots.date": { $gte: today, $lte: nextDays },
        },
      },
      { $unwind: "$timeslots" },
      { $match: { "timeslots.date": { $gte: today, $lte: nextDays } } },
      { $sort: { "timeslots.date": 1 } },
      { $group: { _id: "$groundId", timeslots: { $push: "$timeslots" } } },
    ]);

    if (!slots[0]?.timeslots.length) {
      return response.status(404).json(new ApiError(404, "No slots available for the next 30 days"));
    }

    return response.status(200).json(new ApiResponse(200, slots[0], "Slots fetched successfully"));
  } catch (error: any) {
    return response.status(500).json(new ApiError(500, error.message, "Failed to fetch slots"));
  }
};

export const deleteSlot = async (request: Request, response: Response) => {
  const { slot_id, groundId } = request.body;

  if (!slot_id || !groundId) {
    return response.status(400).json(new ApiError(400, "Slot ID and Ground ID are required"));
  }

  try {
    const updatedData = await Slot.updateOne(
      { groundId, "timeslots._id": slot_id },
      { $pull: { timeslots: { _id: slot_id } } }
    );

    if (updatedData.modifiedCount > 0) {
      return response.status(200).json(new ApiResponse(200, updatedData, "Slot deleted successfully"));
    } else {
      return response.status(404).json(new ApiError(404, "Slot not found or no changes made"));
    }
  } catch (error: any) {
    return response.status(500).json(new ApiError(500, "Internal Server Error", error));
  }
};

export const addMoreSlots = async (request: Request, response: Response) => {
  const { date, startTime, endTime, groundId } = request.body;

  if (!date || !startTime || !endTime || !groundId)
    return response.status(400).json(new ApiError(400, "All fields are required"));

  try {
    const slot = await Slot.findOne({ groundId });
    if (!slot) return response.status(404).json(new ApiError(404, "Slot not found"));

    const timeslot = slot.timeslots.filter(
      (ts) => ts.date.toISOString().split("T")[0] === date
    );

    if (!timeslot || timeslot.length === 0)
      return response.status(404).json(new ApiError(404, "No timeslot found"));

    const hasConflict = timeslot.some(
      (ts) => startTime < ts.endTime && endTime > ts.startTime
    );

    if (hasConflict)
      return response.status(400).json(new ApiError(400, "Timeslot conflicts with existing timeslots"));

    const timeSlotDoc = new TimeSlot({
      endTime,
      startTime,
      date,
      isbooked: false,
      bookedBy: null,
    });

    slot.timeslots.push(timeSlotDoc);
    await slot.save();
    return response.status(200).json(new ApiResponse(200, slot, "Timeslot added successfully"));
  } catch (error: any) {
    return response.status(500).json(new ApiError(500, "Internal server error"));
  }
};

export const getSlotsByDate = async (request: Request, response: Response) => {
  const { groundId, date }: any = request.query;

  if (!groundId || !date) {
    return response.status(400).json(new ApiError(400, "Ground ID and date are required"));
  }

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const slot = await Slot.findOne({
      groundId,
      "timeslots.date": { $gte: startOfDay, $lt: endOfDay },
    });

    if (!slot) {
      return response.status(404).json(new ApiError(404, "No slots found"));
    }

    const slotsForDay = slot.timeslots.filter(
      (ts) => ts.date >= startOfDay && ts.date < endOfDay
    );

    return response.status(200).json(new ApiResponse(200, slotsForDay, "Slots retrieved successfully"));
  } catch (error: any) {
    return response.status(500).json(new ApiError(500, "Internal server error"));
  }
};
