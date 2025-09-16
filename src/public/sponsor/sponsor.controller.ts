import mongoose from "mongoose";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import SponsorModel from "../../modals/sponsor.model";
import { deleteFromS3 } from "../../config/s3Uploader";
import { NextFunction, Request, Response } from "express";
import { CommonService } from "../../services/common.services";

const SponsorService = new CommonService(SponsorModel);

const extractImageUrl = async (input: any, existing?: string) => {
  if (!input || (Array.isArray(input) && input.length === 0))
    return existing || "";
  if (Array.isArray(input) && input.length > 0) {
    const newUrl = input[0]?.url;
    if (existing && existing !== newUrl) {
      const s3Key = existing.split(".com/")[1];
      await deleteFromS3(s3Key);
    }
    return newUrl || "";
  }
  if (typeof input === "string") return input;
  return existing || "";
};

export class SponsorController {
  static async createSponsor(req: Request, res: Response, next: NextFunction) {
    try {
      const logo = req?.body?.logo?.[0]?.url;
      // if (!logo)
      //   return res
      //     .status(400)
      //     .json(new ApiError(400, "Sponsor logo is required"));

      const result = await SponsorService.create({ ...req.body, logo });
      if (!result)
        return res
          .status(400)
          .json(new ApiError(400, "Failed to create sponsor"));

      return res
        .status(201)
        .json(new ApiResponse(201, result, "Created successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAllSponsors(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SponsorService.getAll(req.query);
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAllPublicSponsors(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await SponsorService.getAll({
        ...req.query,
        isActive: "active",
      });
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Public sponsors fetched"));
    } catch (err) {
      next(err);
    }
  }

  static async getSponsorById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await SponsorService.getById(req.params.id);
      if (!result)
        return res.status(404).json(new ApiError(404, "Sponsor not found"));
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async updateSponsorById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id))
        return res
          .status(400)
          .json(new ApiError(400, "Invalid Sponsor ID"));

      const record = await SponsorService.getById(id);
      if (!record)
        return res.status(404).json(new ApiError(404, "Sponsor not found"));

      let logoUrl;
      if (req?.body?.logo && record.logo)
        logoUrl = await extractImageUrl(req?.body?.logo, record.logo as string);

      const result = await SponsorService.updateById(id, {
        ...req.body,
        logo: logoUrl || req?.body?.logo?.[0]?.url,
      });

      if (!result)
        return res
          .status(400)
          .json(new ApiError(400, "Failed to update sponsor"));

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async deleteSponsorById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await SponsorService.deleteById(req.params.id);
      if (!result)
        return res
          .status(404)
          .json(new ApiError(404, "Failed to delete sponsor"));
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Deleted successfully"));
    } catch (err) {
      next(err);
    }
  }
}
