import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Review } from "../../modals/review.model";
import { Booking } from "../../modals/booking.model";
import { asyncHandler } from "../../utils/asyncHandler";
import { Request, Response, NextFunction } from "express";
import { CommonService } from "../../services/common.services";

const reviewService = new CommonService(Review);

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
      userId,
      ratings,
      groundId,
      feedback,
      bookingId,
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
    const review = await reviewService.getById(id);
    if (!review) throw new ApiError(404, "Review not found");
    res
      .status(200)
      .json(new ApiResponse(200, review, "Review fetched successfully"));
  }
);

export const updateStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = await reviewService.updateById(id, req.body);
    return res
      .status(201)
      .json(new ApiResponse(200, updated, "Status Updated"));
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
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: "$userData" },
      {
        $lookup: {
          from: "grounds",
          localField: "groundId",
          foreignField: "_id",
          as: "groundData",
        },
      },
      { $unwind: "$groundData" },
      {
        $project: {
          _id: 1,
          status: 1,
          ratings: 1,
          feedback: 1,
          createdAt: 1,
          updatedAt: 1,
          userEmail: "$userData.email",
          groundName: "$groundData.name",
          userLastName: "$userData.lastName",
          groundAddress: "$groundData.address",
          userFirstName: "$userData.firstName",
          groundLocation: "$groundData.location",
          userPhoneNumber: "$userData.phoneNumber",
        },
      },
    ];
    const reviews = await reviewService.getAll(req.query, pipeline);
    res
      .status(200)
      .json(new ApiResponse(200, reviews, "All reviews fetched successfully"));
  }
);
