import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  items: any;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  totalAmount: number;
  finalAmount: number;
  discountAmount: number;
  user: mongoose.Types.ObjectId;
  paymentMethod: "COD" | "ONLINE";
  couponId: mongoose.Types.ObjectId;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
}

const orderSchema = new Schema<IOrder>(
  {
    items: [],
    discountAmount: { type: Number },
    totalAmount: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paymentMethod: { type: String, enum: ["COD", "ONLINE"], required: true },
    paymentStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "paid", "failed"],
    },
    orderStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    },
    couponId: {
      ref: "Coupon",
      type: Schema.Types.ObjectId,
    },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
