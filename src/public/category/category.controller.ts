import { Request, Response, NextFunction } from "express";
import { BlogCategory } from "../../modals/category.model";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { CommonService } from "../../services/common.services";

const categoryService = new CommonService(BlogCategory);

// 📌 Create Category
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryService.create(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, category, "Category created successfully"));
  } catch (err) {
    next(err);
  }
};

// 📌 Get All Categories
export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await categoryService.getAll(req.query);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Data fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// 📌 Get Category by ID
export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryService.getById(req.params.id);
    if (!category) throw new ApiError(404, "Category not found");
    return res
      .status(200)
      .json(new ApiResponse(200, category, "Category found"));
  } catch (err) {
    next(err);
  }
};

// 📌 Update Category
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const updated = await categoryService.updateById(req.params.id, req.body);
    if (!updated) throw new ApiError(404, "Category not found");
    return res
      .status(200)
      .json(new ApiResponse(200, updated, "Category updated"));
  } catch (err) {
    next(err);
  }
};

// 📌 Delete Category
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleted = await categoryService.deleteById(req.params.id);
    if (!deleted) throw new ApiError(404, "Category not found");
    return res
      .status(200)
      .json(new ApiResponse(200, deleted, "Category deleted"));
  } catch (err) {
    next(err);
  }
};
