import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Brand } from "../../modals/brandModal";
import { CommonService } from "../../services/common.services";
import { deleteFromS3 } from "../../config/s3Uploader";

// 🔹 helper (same as in Banner)
export const extractImageUrl = async (input: any, existing: string) => {
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

const brandService = new CommonService(Brand);

export class BrandController {
  /**
   * 🟢 Create Brand
   */
  static async createBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const imageUrl = req?.body?.imageUrl?.[0]?.url;
      if (!imageUrl)
        return res
          .status(403)
          .json(new ApiError(403, "Brand image is required."));

      const brand = await Brand.create({
        ...req.body,
        imageUrl,
        isActive: req.body.isActive === "active",
      });
      return res
        .status(201)
        .json(new ApiResponse(201, brand, "Brand created successfully"));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 🟢 Update Brand
   */
  static async updateBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json(new ApiError(400, "Invalid brand ID"));

      const brand = await Brand.findById(id);
      if (!brand) return next(new ApiError(404, "Brand not found"));

      let imageUrl = brand.imageUrl;
      if (req?.body?.imageUrl) {
        imageUrl = await extractImageUrl(
          req.body.imageUrl,
          brand.imageUrl as any
        );
      }

      Object.assign(brand, {
        ...req.body,
        imageUrl,
        isActive: req.body.isActive === "active",
      });
      await brand.save();

      return res
        .status(200)
        .json(new ApiResponse(200, brand, "Brand updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 🟢 Get Brand by ID
   */
  static async getBrandById(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await Brand.findById(req.params.id);
      if (!brand) return next(new ApiError(404, "Brand not found"));
      return res
        .status(200)
        .json(new ApiResponse(200, brand, "Brand fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 🟢 Get All Brands (Admin)
   */
  static async getAllBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await brandService.getAll(req.query);
      return res
        .status(200)
        .json(new ApiResponse(200, brands, "Brands fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 🟢 Get All Active Brands (Public)
   */
  static async getPublicBrands(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const brands = await brandService.getAll({ isActive: true });
      return res
        .status(200)
        .json(new ApiResponse(200, brands, "Brands fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 🟢 Delete Brand
   */
  static async deleteBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const brand = await Brand.findByIdAndDelete(id);
      if (!brand) return next(new ApiError(404, "Brand not found"));
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Brand deleted successfully"));
    } catch (err) {
      next(err);
    }
  }
}
