import mongoose, { Schema, Document, Mongoose } from "mongoose";

export interface ITestimonial extends Document {
  name: string;
  image?: string;
  feedback: string;
  rating: string;
  isVerified: boolean;
  isActive: boolean;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true },
    image: { type: String },
    feedback: { type: String, required: true },
    rating: { type: String, required: true, min: 1, max: 5 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Testimonial = mongoose.model<ITestimonial>(
  "Testimonial",
  testimonialSchema
);
