import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Request, Response, NextFunction } from "express";
import { CommonService } from "../../services/common.services";
import { Progress } from "../../modals/progress.model";

const progressService = new CommonService(Progress);

export class ProgressController {
  static async createProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await Progress.create(req.body);
      return res.status(201).json(new ApiResponse(201, progress, "Progress record created successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const progress = await Progress.findById(id);
      if (!progress) return next(new ApiError(404, "Progress record not found"));

      Object.assign(progress, req.body);
      await progress.save();

      return res.status(200).json(new ApiResponse(200, progress, "Progress record updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getProgressByStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const progressRecords = await progressService.getAll({ studentId });
      return res.status(200).json(new ApiResponse(200, progressRecords, "Progress records fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAllProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progressRecords = await progressService.getAll(req.query);
      return res.status(200).json(new ApiResponse(200, progressRecords, "Progress records fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async deleteProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const progress = await Progress.findByIdAndDelete(id);
      if (!progress) return next(new ApiError(404, "Progress record not found"));

      return res.status(200).json(new ApiResponse(200, null, "Progress record deleted successfully"));
    } catch (err) {
      next(err);
    }
  }
}
