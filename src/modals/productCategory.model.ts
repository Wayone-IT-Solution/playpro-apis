import slugify from "slugify";
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  isParent: boolean;
  description?: string;
  status: CategoryStatus;
  parentCategory?: Types.ObjectId;
}

/**
 * Enum for category visibility status
 */
export enum CategoryStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      default: CategoryStatus.INACTIVE,
      enum: Object.values(CategoryStatus),
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      validate: {
        validator: function (v: Types.ObjectId) {
          return mongoose
            .model("Category")
            .findById(v)
            .then((category) => !category?.parentCategory);
        },
        message: "Parent category cannot be a subcategory",
      },
    },
    isParent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Middleware to generate slug
CategorySchema.pre<ICategory>("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model<ICategory>("Category", CategorySchema);
