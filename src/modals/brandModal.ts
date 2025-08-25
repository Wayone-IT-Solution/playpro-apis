import mongoose, { Schema, Document } from "mongoose";

export interface IBrand extends Document {
  name: string; 
  imageUrl?: string; 
  description?: string; 
  country?: string;
  establishedYear?: number; 
  isActive: boolean; 
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema: Schema<IBrand> = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String },
    description: { type: String },
    country: { type: String },
    establishedYear: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Brand = mongoose.model<IBrand>("Brand", brandSchema);
