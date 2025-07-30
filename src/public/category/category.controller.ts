import { Request, Response, NextFunction } from "express";
import { BlogCategory } from "../../modals/category.model";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";

// 📌 Create Category
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await BlogCategory.create(req.body);
    return res.status(201).json(new ApiResponse(201, category, "Category created successfully"));
  } catch (err) {
    next(err);
  }
};

// 📌 Get All Categories
export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await BlogCategory.find();
    return res.status(200).json(new ApiResponse(200, categories, "Categories fetched"));
  } catch (err) {
    next(err);
  }
};

// 📌 Get Category by ID
export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    if (!category) throw new ApiError(404, "Category not found");
    return res.status(200).json(new ApiResponse(200, category, "Category found"));
  } catch (err) {
    next(err);
  }
};

// 📌 Update Category
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await BlogCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) throw new ApiError(404, "Category not found");
    return res.status(200).json(new ApiResponse(200, updated, "Category updated"));
  } catch (err) {
    next(err);
  }
};

// 📌 Delete Category
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await BlogCategory.findByIdAndDelete(req.params.id);
    if (!deleted) throw new ApiError(404, "Category not found");
    return res.status(200).json(new ApiResponse(200, deleted, "Category deleted"));
  } catch (err) {
    next(err);
  }
};
