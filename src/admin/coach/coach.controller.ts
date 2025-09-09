import ApiError from "../../utils/ApiError";
import { Coach } from "../../modals/coach.model";
import ApiResponse from "../../utils/ApiResponse";
import { deepUnflatten } from "../../modals/ground.model";
import { NextFunction, Request, Response } from "express";
import { extractImageUrl } from "../banner/banner.controller";
import { CommonService } from "../../services/common.services";

const CoachService = new CommonService(Coach);

export class CoachController {
  static async createCoach(req: Request, res: Response, next: NextFunction) {
    try {
      const profileImage = req.body.profileImage?.[0]?.url;
      const result = await CoachService.create({ ...req.body, profileImage });
      if (!result)
        return res
          .status(400)
          .json(new ApiError(400, "Failed to create Coach"));
      return res
        .status(201)
        .json(new ApiResponse(201, result, "Created successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAllCoachs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CoachService.getAll(req.query);
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getCoachById(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = (req as any).user;
      const result = await CoachService.getById(
        req.params.id,
        role !== "admin"
      );
      if (!result)
        return res.status(404).json(new ApiError(404, "Coach not found"));
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async updateCoachById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.params.id;
      const profileImage = req?.body?.profileImage?.[0]?.url;

      const record = await CoachService.getById(id);
      if (!record) {
        return res.status(404).json(new ApiError(404, "Banner not found."));
      }

      let imageUrl;
      if (req?.body?.profileImage && record.profileImage)
        imageUrl = await extractImageUrl(
          req?.body?.image,
          record.profileImage as string
        );
      req.body.profileImage = imageUrl || profileImage;
      req.body = deepUnflatten(req.body)
      const result = await CoachService.updateById(id, req.body);
      if (!result)
        return res
          .status(404)
          .json(new ApiError(404, "Failed to update Coach"));
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async deleteCoachById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await CoachService.deleteById(req.params.id);
      if (!result)
        return res
          .status(404)
          .json(new ApiError(404, "Failed to delete Coach"));
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Deleted successfully"));
    } catch (err) {
      next(err);
    }
  }
}
