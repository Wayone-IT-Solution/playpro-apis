import ApiError from "../../utils/ApiError";
import { Blog } from "../../modals/blog.model";
import ApiResponse from "../../utils/ApiResponse";
import { deepUnflatten } from "../../modals/ground.model";
import { Request, Response, NextFunction } from "express";
import { CommonService } from "../../services/common.services";
import { extractImageUrl } from "../../admin/banner/banner.controller";

const blogService = new CommonService(Blog);

// CREATE
export const createBlog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const imageUrl = req?.body?.imageUrl?.[0]?.url;
    if (!imageUrl)
      return res
        .status(403)
        .json(new ApiError(403, "Blog imageUrl is Required."));
    req.body.imageUrl = imageUrl;
    req.body.isActive = req.body.isActive === "active"
    req.body = deepUnflatten(req.body);
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
          description: 1,
          short_description: 1,
          categoryNameEN: "$categoryData.name.en",
          categoryNameAR: "$categoryData.name.ar",
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

export const getAllPublicBlogs = async (
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
          description: 1,
          short_description: 1,
          category: "$categoryData.name",
        },
      },
    ];
    const result = await blogService.getAll({ ...req.query, isActive: true }, pipeline);
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

export const getBlogBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const blog = await Blog.findOne({ slug: req.params.slug });
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
    const id = req.params.id;
    const imageUrl = req?.body?.imageUrl?.[0]?.url;
    const record = await blogService.getById(id);
    if (!record) {
      return res.status(404).json(new ApiError(404, "Blog not found."));
    }

    let image;
    if (req?.body?.imageUrl && record.imageUrl)
      image = await extractImageUrl(
        req?.body?.imageUrl,
        record.imageUrl as string
      );

    req.body.imageUrl = imageUrl;
    req.body.isActive = req.body.isActive === "active" || req.body.isActive === "true"
    req.body = deepUnflatten(req.body);

    const blog = await blogService.updateById(id, req.body);
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
