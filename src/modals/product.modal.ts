import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProduct extends Document {
  name: string;
  price: number;
  description?: string;
  rating?: number;
  brand: Types.ObjectId;
  category: Types.ObjectId;
  subCategory?: Types.ObjectId;
  images?: string[];
  features: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema: Schema<IProduct> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    description: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },

    // Relations
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },

    images: [{ type: String }],

   
    features: { type: Schema.Types.Mixed, default: {} },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", productSchema);
