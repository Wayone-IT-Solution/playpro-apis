import mongoose, { Document, Schema } from "mongoose";

export interface IGround extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  status: string;
  type: string;
  address: string;
  description?: string;
  location: {
    type: string;
    coordinates: number[];
  };
  pricePerHour: number;
  images: string[];
  facilities: string[];
}

const groundSchema = new Schema<IGround>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      default: "active",
    },
    address: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude,
      },
    },
    pricePerHour: {
      type: Number,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    facilities: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

groundSchema.index({ location: "2dsphere" });

export const Ground = mongoose.model<IGround>("Ground", groundSchema);
