import mongoose, { Document, Schema } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  groundId: mongoose.Types.ObjectId;
  slots: mongoose.Types.ObjectId[]; // Array of slot IDs
  rescheduled?: boolean;
  totalAmount: number;
  finalAmount: number;
  numberOfGuests: number;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "rescheduled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentId?: string;
  notes: Record<string, any>; // empty object by default
  emergencyContact: {
    name: string;
    phoneNumber: string;
    email: string;
  };
  paymentDetails: Record<string, any>;
  meta?: Record<string, any>;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groundId: {
      type: Schema.Types.ObjectId,
      ref: "Ground",
      required: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    slots: [
      {
        type: Schema.Types.ObjectId,
        ref: "Slot",
        required: true,
      },
    ],
    // couponId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Coupon",
    // },
    totalAmount: {
      type: Number,
      required: true,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    rescheduled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "rescheduled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },

    notes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    emergencyContact: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phoneNumber: {
        type: String,
        required: true,
        validate: {
          validator: (val: string) => /^[6-9]\d{9}$/.test(val),
          message: "Invalid Indian mobile number",
        },
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
    },
    paymentDetails: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
