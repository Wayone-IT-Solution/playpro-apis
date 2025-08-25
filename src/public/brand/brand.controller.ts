import { Request, Response, NextFunction } from "express";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Brand } from "../../modals/brandModal"; 
import { CommonService } from "../../services/common.services";

const brandService = new CommonService(Brand);

export class BrandController {
  /**
   * 🟢 Create Brand
   */
  static async createBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await Brand.create(req.body);
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
      const brand = await Brand.findById(id);
      if (!brand) return next(new ApiError(404, "Brand not found"));

      Object.assign(brand, req.body);
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
  static async getPublicBrands(req: Request, res: Response, next: NextFunction) {
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