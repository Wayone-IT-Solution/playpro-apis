  import { Schema, model, Document } from "mongoose";

  export interface ILocalizedField {
    en: string;
    ar?: string;
  }

  export interface ISponsor extends Document {
    name: ILocalizedField;
    website: string;
    logo?: string;
    description?: ILocalizedField;
    isActive: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }

  const localizedFieldSchema = new Schema<ILocalizedField>(
    {
      en: { type: String, required: true },
      ar: { type: String, required: false },
    },
    { _id: false }
  );

  const sponsorSchema = new Schema<ISponsor>(
    {
      name: { type: localizedFieldSchema, required: true },
      website: { type: String, required: true },
      logo: { type: String },
      description: { type: localizedFieldSchema },
      isActive: { type: String, default: "active" },
      order: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  const SponsorModel = model<ISponsor>("Sponsor", sponsorSchema);
  export default SponsorModel;
