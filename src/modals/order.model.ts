import mongoose, { Schema, Document } from "mongoose";

export interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrder extends Document {
  items: any;
  address: IAddress;
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

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false } // Prevent Mongoose from creating a separate _id for this subdocument
);

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
    address: { type: addressSchema, required: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
