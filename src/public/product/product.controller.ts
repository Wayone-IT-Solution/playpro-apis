import mongoose from "mongoose";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { deleteFromS3 } from "../../config/s3Uploader";
import { NextFunction, Request, Response } from "express";
import { CommonService } from "../../services/common.services";
import { Product } from "../../modals/product.modal";

// Utility to handle single image extraction & S3 deletion if replaced
export const extractImageUrl = async (input: any, existing: string) => {
  if (!input) return existing || "";
  const newUrl = input[0]?.url || (typeof input === "string" ? input : "");
  if (existing && existing !== newUrl) {
    const s3Key = existing.split(".com/")[1];
    await deleteFromS3(s3Key);
  }
  return newUrl;
};

const ProductService = new CommonService(Product);

export class ProductController {
  // Create Product
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const image = req?.body?.image?.[0]?.url;
      if (!image)
        return res
          .status(403)
          .json(new ApiError(403, "Product image is required."));

      const result = await ProductService.create({ ...req.body, image });
      if (!result)
        return res
          .status(400)
          .json(new ApiError(400, "Failed to create product"));

      return res
        .status(201)
        .json(new ApiResponse(201, result, "Created successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Get all products
  static async getAllProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.getAll(req.query);
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Get all public (active) products
  static async getAllPublicProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await ProductService.getAll({
        ...req.query,
        isActive: true,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Get product by ID
  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.getById(req.params.id);
      if (!result)
        return res.status(404).json(new ApiError(404, "Product not found"));
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Update Product
  static async updateProductById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json(new ApiError(400, "Invalid product ID"));

      const record = await ProductService.getById(id);
      if (!record)
        return res.status(404).json(new ApiError(404, "Product not found"));

      let imageUrl;
      if (req?.body?.image && record.image)
        imageUrl = await extractImageUrl(req.body.image, record.image);

      const result = await ProductService.updateById(id, {
        ...req.body,
        image: imageUrl || req?.body?.image?.[0]?.url,
      });
      if (!result)
        return res
          .status(404)
          .json(new ApiError(404, "Failed to update product"));

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Delete Product
  static async deleteProductById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await ProductService.deleteById(req.params.id);
      if (!result)
        return res
          .status(404)
          .json(new ApiError(404, "Failed to delete product"));
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Deleted successfully"));
    } catch (err) {
      next(err);
    }
  }
}
