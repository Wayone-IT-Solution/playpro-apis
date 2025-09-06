import { Schema, model, Document } from "mongoose";

export interface ILocalizedField {
  en: string;
  ar?: string;
}

export interface IBanner extends Document {
  order: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: string;
  title: ILocalizedField;
  description: ILocalizedField;
}

const localizedFieldSchema = new Schema<ILocalizedField>(
  {
    en: { type: String, required: true },
    ar: { type: String, required: true },
  },
  { _id: false }
);

const bannerSchema = new Schema<IBanner>(
  {
    image: { type: String, required: true },
    description: { type: localizedFieldSchema },
    isActive: { type: String, default: "active" },
    order: { type: Number, required: true, default: 0 },
    title: { type: localizedFieldSchema, required: true },
  },
  { timestamps: true }
);

const BannerModel = model<IBanner>("Banner", bannerSchema);
export default BannerModel;
