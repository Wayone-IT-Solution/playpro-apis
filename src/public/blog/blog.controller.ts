import { Request, Response, NextFunction } from "express";
import { Blog } from "../../modals/blog.model";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import mongoose from "mongoose";

// CREATE
export const createBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blog = await Blog.create(req.body);
    return res.status(201).json(new ApiResponse(201, blog, "Blog created successfully"));
  } catch (error) {
    next(error);
  }
};

export const getAllBlogs = async (req: Request, res: Response, next: NextFunction) => {
  const blogs = await Blog.find().populate("categoryId", "name"); // fetch category name only
  res.status(200).json(new ApiResponse(200, blogs, "Fetched all blogs"));
};

export const getBlogById = async (req: Request, res: Response, next: NextFunction) => {
  const blog = await Blog.findById(req.params.id).populate("categoryId", "name");

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  res.status(200).json(new ApiResponse(200, blog, "Fetched blog by ID"));
};


// UPDATE
export const updateBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) throw new ApiError(404, "Blog not found");
    return res.status(200).json(new ApiResponse(200, blog, "Blog updated successfully"));
  } catch (error) {
    next(error);
  }
};

// DELETE
export const deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) throw new ApiError(404, "Blog not found");
    return res.status(200).json(new ApiResponse(200, blog, "Blog deleted successfully"));
  } catch (error) {
    next(error);
  }
};
