import mongoose, { Schema, Document, Types } from "mongoose";
import { ILocalizedField } from "./ground.model";

export enum AcademyStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  CLOSED = "closed",
}


export enum SportType {
  FOOTBALL = "football",
  BASKETBALL = "basketball",
  TENNIS = "tennis",
  SWIMMING = "swimming",
  VOLLEYBALL = "volleyball",
  BADMINTON = "badminton",
  TABLE_TENNIS = "table_tennis",
  KARATE = "karate",
  TAEKWONDO = "taekwondo",
  GYMNASTICS = "gymnastics",
}

// Define IAcademy interface
export interface IAcademy extends Document {
  name: ILocalizedField;
  description: ILocalizedField;
  ground: Types.ObjectId;
  sports: ILocalizedField[];
  coaches: Types.ObjectId[];
  status: AcademyStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Define schema
const AcademySchema = new Schema<IAcademy>(
  {
    name: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: Schema.Types.Mixed,
      required: true,
    },
    ground: {
      type: Schema.Types.ObjectId,
      ref: "Ground",
      required: true,
    },
    sports: [
      {
        type: Schema.Types.Mixed,
        enum: Object.values(SportType),
        required: true,
      },
    ],
    coaches: [
      {
        type: Schema.Types.ObjectId,
        ref: "Coach",
      },
    ],
    status: {
      type: String,
      enum: Object.values(AcademyStatus),
      default: AcademyStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for text search on localized fields
AcademySchema.index({
  "name.en": "text",
  "name.ar": "text",
  "description.en": "text",
  "description.ar": "text",
});

// Create and export model
export const Academy = mongoose.model<IAcademy>("Academy", AcademySchema);
