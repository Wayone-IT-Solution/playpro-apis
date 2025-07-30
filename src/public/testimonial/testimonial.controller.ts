import { Request, Response, NextFunction } from "express";
import { Testimonial } from "../../modals/testimonial.model";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import mongoose from "mongoose";

// ✅ Create testimonial
export const createTestimonial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, name, image, feedback, rating, isVerified, isActive } = req.body;

    if (!name || !feedback || !rating || !userId) {
      return next(new ApiError(400, "Required fields are missing"));
    }

    const testimonial = await Testimonial.create({
      userId,
      name,
      image,
      feedback,
      rating,
      isVerified,
      isActive,
    });

    return res.status(201).json(new ApiResponse(201, testimonial, "Testimonial created successfully"));
  } catch (err) {
    next(err);
  }
};

// ✅ Get all testimonials
export const getAllTestimonials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testimonials = await Testimonial.find();
    return res.status(200).json(new ApiResponse(200, testimonials, "Testimonials fetched successfully"));
  } catch (err) {
    next(err);
  }
};

// ✅ Get testimonial by ID
export const getTestimonialById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return next(new ApiError(404, "Testimonial not found"));
    }

    return res.status(200).json(new ApiResponse(200, testimonial, "Testimonial fetched successfully"));
  } catch (err) {
    next(err);
  }
};

// ✅ Update testimonial
export const updateTestimonial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const testimonial = await Testimonial.findByIdAndUpdate(id, updates, { new: true });

    if (!testimonial) {
      return next(new ApiError(404, "Testimonial not found"));
    }

    return res.status(200).json(new ApiResponse(200, testimonial, "Testimonial updated successfully"));
  } catch (err) {
    next(err);
  }
};

// ✅ Delete testimonial
export const deleteTestimonial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const deleted = await Testimonial.findByIdAndDelete(id);

    if (!deleted) {
      return next(new ApiError(404, "Testimonial not found"));
    }

    return res.status(200).json(new ApiResponse(200, deleted, "Testimonial deleted successfully"));
  } catch (err) {
    next(err);
  }
};
