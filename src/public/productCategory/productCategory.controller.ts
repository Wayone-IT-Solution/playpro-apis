import { Request, Response, NextFunction } from "express";
import { paginationResult } from "../../utils/helper";
import Category, {
  ICategory,
  CategoryStatus,
} from "../../modals/productCategory.model";

const getPipeline = (query: Record<string, any>) => {
  const {
    type,
    status,
    endDate,
    page = 1,
    startDate,
    searchkey,
    limit = 10,
    search = "",
    sortdir = "desc",
    sortkey = "createdAt",
  } = query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const pipeline: any[] = [];
  const matchStage: Record<string, any> = {};

  if (type) matchStage.type = type;
  if (search && searchkey)
    matchStage[searchkey] = { $regex: search, $options: "i" };
  if (status) matchStage.status = status;

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  if (Object.keys(matchStage).length > 0) pipeline.push({ $match: matchStage });

  const sortStage = {
    $sort: { [sortkey]: sortdir === "asc" ? 1 : -1 },
  };
  pipeline.push(sortStage);

  // Pagination logic
  pipeline.push({ $skip: (pageNumber - 1) * limitNumber });
  pipeline.push({ $limit: limitNumber });

  const options = {
    collation: {
      locale: "en",
      strength: 2, // Case-insensitive collation
    },
  };

  return { pipeline, matchStage, options };
};

export class CategoryController {
  /**
   * 📁 Get all categories by parent ID
   */
  static async getCategoriesByParentId(
    req: Request<{ parentId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { parentId } = req.params;
      const categories = await Category.find(
        {
          parentCategory: parentId,
          status: CategoryStatus.ACTIVE,
        },
        { _id: 1, name: 1 }
      ).sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 🟢 Get all active categories (Public Route)
   */
  static async getActiveCategories(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categories = await Category.find(
        {
          parentCategory: null,
          status: CategoryStatus.ACTIVE,
        },
        { _id: 1, name: 1 }
      ).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 🆕 Create a new category (Admin only)
   */
  static async createCategory(
    req: Request<
      {},
      {},
      Pick<ICategory, "name" | "description" | "status" | "parentCategory">
    >,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, description, status, parentCategory } = req.body;
      const category = await Category.create({
        name,
        description,
        parentCategory,
        isParent: parentCategory ? true : false,
        status: status || CategoryStatus.INACTIVE,
      });

      res.status(201).json({
        success: true,
        data: category,
        message: "Category created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 📋 Get all categories (Admin only)
   */
  static async getAllCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page = 1, limit = 10 }: any = req.query;
      const { pipeline, matchStage, options } = getPipeline(req.query);

      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      pipeline.push({
        $lookup: {
          from: "categories",
          localField: "parentCategory",
          foreignField: "_id",
          as: "parentCategoryDetails",
        },
      });

      pipeline.push({
        $project: {
          _id: 1,
          name: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          description: 1,
          parentCategory: 1,
          parentCategoryDetails: {
            $arrayElemAt: ["$parentCategoryDetails", 0],
          },
        },
      });

      const categories = await Category.aggregate(pipeline, options);
      const totalCategories = await Category.countDocuments(
        Object.keys(matchStage).length > 0 ? matchStage : {}
      );

      const response = paginationResult(
        pageNumber,
        limitNumber,
        totalCategories,
        categories
      );

      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 🔍 Get a category by ID (Admin only)
   */
  static async getCategoryById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        res.status(404).json({ success: false, message: "Category not found" });
        return;
      }
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ✏️ Update category (Admin only)
   */
  static async updateCategory(
    req: Request<{ id: string }, {}, Partial<ICategory>>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const updates = { ...req.body };
      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );
      if (!updatedCategory) {
        res.status(404).json({ success: false, message: "Category not found" });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: updatedCategory,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 🗑 Delete a category (Admin only)
   */
  static async deleteCategory(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const deletedCategory = await Category.findByIdAndDelete(req.params.id);
      if (!deletedCategory) {
        res.status(404).json({ success: false, message: "Category not found" });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
