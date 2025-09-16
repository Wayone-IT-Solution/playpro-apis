import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Request, Response, NextFunction } from "express";
import { CommonService } from "../../services/common.services";
import { TrainingSlot } from "../../modals/traningslot.model";

const trainingSlotService = new CommonService(TrainingSlot);

export class TrainingSlotController {
  static async createTrainingSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const trainingSlot = await TrainingSlot.create(req.body);
      return res.status(201).json(new ApiResponse(201, trainingSlot, "TrainingSlot created successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async updateTrainingSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const trainingSlot = await TrainingSlot.findById(id);
      if (!trainingSlot) return next(new ApiError(404, "TrainingSlot not found"));

      Object.assign(trainingSlot, req.body);
      await trainingSlot.save();

      return res.status(200).json(new ApiResponse(200, trainingSlot, "TrainingSlot updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getTrainingSlotById(req: Request, res: Response, next: NextFunction) {
    try {
      const trainingSlot = await trainingSlotService.getById(req.params.id);
      if (!trainingSlot) return next(new ApiError(404, "TrainingSlot not found"));

      return res.status(200).json(new ApiResponse(200, trainingSlot, "TrainingSlot fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAllTrainingSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const trainingSlots = await trainingSlotService.getAll(req.query);
      return res.status(200).json(new ApiResponse(200, trainingSlots, "TrainingSlots fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async deleteTrainingSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const trainingSlot = await TrainingSlot.findByIdAndDelete(id);
      if (!trainingSlot) return next(new ApiError(404, "TrainingSlot not found"));

      return res.status(200).json(new ApiResponse(200, null, "TrainingSlot deleted successfully"));
    } catch (err) {
      next(err);
    }
  }
}
