import mongoose, { Schema, Document, model } from "mongoose";

// 🌍 Localized field interface
export interface ILocalizedField {
  en: string;
  ar?: string;
}

// 1. Define the interface for the BlogCategory document
export interface IBlogCategory extends Document {
  name: ILocalizedField;
  type: string;
  description?: ILocalizedField;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Localized field schema
const localizedFieldSchema = new Schema<ILocalizedField>(
  {
    en: { type: String, required: true, trim: true, maxlength: 50, minlength: 2 },
    ar: { type: String, trim: true, maxlength: 50, minlength: 2 },
  },
  { _id: false }
);

// 3. Schema definition
const BlogCategorySchema: Schema<IBlogCategory> = new Schema(
  {
    name: { type: localizedFieldSchema, required: true },
    type: { type: String, required: true, default: "general" },
    description: { type: localizedFieldSchema },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 4. Compound index to enforce unique name.en + type
BlogCategorySchema.index({ "name.en": 1, type: 1 }, { unique: true });

// 5. Export model with hot-reload safety
export const BlogCategory =
  mongoose.models.BlogCategory as mongoose.Model<IBlogCategory> ||
  model<IBlogCategory>("BlogCategory", BlogCategorySchema);
