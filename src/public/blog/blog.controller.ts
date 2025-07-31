import { Request, Response, NextFunction } from "express";
import { Blog } from "../../modals/blog.model";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { CommonService } from "../../services/common.services";

const blogService = new CommonService(Blog);

// CREATE
export const createBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const blog = await Blog.create(req.body);
    return res
      .status(201)
      .json(new ApiResponse(201, blog, "Blog created successfully"));
  } catch (error) {
    next(error);
  }
};

export const getAllBlogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: "blogcategories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      { $unwind: "$categoryData" },
      {
        $project: {
          _id: 1,
          slug: 1,
          title: 1,
          isActive: 1,
          imageUrl: 1,
          createdAt: 1,
          updatedAt: 1,
          categoryName: "$categoryData.name",
        },
      },
    ];
    const result = await blogService.getAll(req.query, pipeline);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Data fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getBlogById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const blog = await blogService.getById(req.params.id, false);
  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }
  res.status(200).json(new ApiResponse(200, blog, "Fetched blog by ID"));
};

// UPDATE
export const updateBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!blog) throw new ApiError(404, "Blog not found");
    return res
      .status(200)
      .json(new ApiResponse(200, blog, "Blog updated successfully"));
  } catch (error) {
    next(error);
  }
};

// DELETE
export const deleteBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) throw new ApiError(404, "Blog not found");
    return res
      .status(200)
      .json(new ApiResponse(200, blog, "Blog deleted successfully"));
  } catch (error) {
    next(error);
  }
};
