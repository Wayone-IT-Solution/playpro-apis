import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  groundId: mongoose.Types.ObjectId;
  feedback: string;
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
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groundId: { type: Schema.Types.ObjectId, ref: "Ground", required: true },
    feedback: { type: String, required: true },
    ratings: { type: RatingsSchema, required: true },
    averageRating: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Review = mongoose.model<IReview>("Review", ReviewSchema);
