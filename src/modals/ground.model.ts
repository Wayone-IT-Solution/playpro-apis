import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Localized field for multi-language support
 */
export interface ILocalizedField {
  en: string;
  ar?: string;
}

/**
 * Ground interface
 */
export interface IGround extends Document {
  userId: Types.ObjectId;
  name: ILocalizedField;
  status: "active" | "inactive" | "maintenance";
  type: ILocalizedField;
  address: ILocalizedField;
  description?: ILocalizedField;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  pricePerHour: number;
  images: string[];
  facilities: ILocalizedField[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Localized schema reusable for all fields
 */
const localizedFieldSchema = new Schema<ILocalizedField>(
  {
    en: { type: String, required: true, trim: true },
    ar: { type: String, trim: true },
  },
  { _id: false }
);

const groundSchema = new Schema<IGround>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: localizedFieldSchema,
      required: true,
    },
    type: {
      type: localizedFieldSchema,
      required: true,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "maintenance"],
    },
    address: {
      type: localizedFieldSchema,
      required: true,
    },
    description: {
      type: localizedFieldSchema,
      default: { en: "" },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    facilities: {
      type: [localizedFieldSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Geospatial index
groundSchema.index({ location: "2dsphere" });

export const Ground =
  mongoose.models.Ground || mongoose.model<IGround>("Ground", groundSchema);
