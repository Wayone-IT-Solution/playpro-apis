import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  feedback: string;
  userId: mongoose.Types.ObjectId;
  groundId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  ratings: {
    cleanliness: number;
    maintenance: number;
    staffBehavior: number;
    valueForMoney: number;
    groundCondition: number;
    overallExperience: number;
  };
  averageRating: number;
  status: "active" | "inactive";
}

const RatingsSchema = new Schema(
  {
    cleanliness: { type: Number, required: true, min: 1, max: 5 },
    maintenance: { type: Number, required: true, min: 1, max: 5 },
    staffBehavior: { type: Number, required: true, min: 1, max: 5 },
    valueForMoney: { type: Number, required: true, min: 1, max: 5 },
    groundCondition: { type: Number, required: true, min: 1, max: 5 },
    overallExperience: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groundId: { type: Schema.Types.ObjectId, ref: "Ground", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    feedback: { type: String, required: true },
    averageRating: { type: Number, required: true },
    ratings: { type: RatingsSchema, required: true },
    status: {
      type: String,
      default: "inactive",
      enum: ["active", "inactive"],
    },
  },
  { timestamps: true }
);

export const Review = mongoose.model<IReview>("Review", ReviewSchema);
