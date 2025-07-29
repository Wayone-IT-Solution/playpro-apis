import { Request, Response, NextFunction } from "express";
import { Review } from "../../modals/review.model";
import { Booking } from "../../modals/booking.model";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";

export const createReview = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { bookingId, feedback, ratings } = req.body;
    const ratingValues = Object.values(ratings) as number[];
    const averageRating =
      ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new ApiError(404, "Booking not found");

    // Check if already reviewed
    const alreadyReviewed = await Review.findOne({ bookingId });
    if (alreadyReviewed)
      throw new ApiError(400, "Already reviewed this booking");

    const { userId, groundId } = booking;

    const review = await Review.create({
      bookingId,
      userId,
      groundId,
      feedback,
      ratings,
      averageRating: parseFloat(averageRating.toFixed(1)),
    });

    return res
      .status(201)
      .json(new ApiResponse(201, review, "Review submitted successfully"));
  }
);

export const getReviewsByGround = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { groundId } = req.params;

    const reviews = await Review.find({ groundId })
      .populate("userId", "firstName lastName")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, reviews, "Ground reviews fetched"));
  }
);
export const getReviewByIdAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const review = await Review.findById(id)
      .populate("userId", "firstName lastName")
      .populate("groundId", "name");

    if (!review) throw new ApiError(404, "Review not found");

    res
      .status(200)
      .json(new ApiResponse(200, review, "Review fetched successfully"));
  }
);

export const deleteReviewByIdAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);
    if (!review) throw new ApiError(404, "Review not found or already deleted");

    res
      .status(200)
      .json(new ApiResponse(200, review, "Review deleted successfully"));
  }
);

export const getAllReviewsAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const reviews = await Review.find({})
      .populate("userId", "firstName lastName")
      .populate("groundId", "name")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json(new ApiResponse(200, reviews, "All reviews fetched successfully"));
  }
);
