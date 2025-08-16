import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { config } from "../config/config";
import mongoose, { Document, Schema } from "mongoose";

// 🔒 Interface
export interface IUser extends Document {
  email: string;
  lastName: string;
  password?: string;
  fcmToken?: string;
  firstName: string;
  dateOfBirth: Date;
  phoneNumber: string;
  role?: string;
  status: "active" | "pending";
  profilePicture?: string;
  userProfile?: {
    sms?: boolean;
    push?: boolean;
    email?: boolean;
  };
  businessDetail?: Record<string, any>;
  contactDetail?: Record<string, any>;
  generateJWT(): string;
  comparePassword?(candidatePassword: string): Promise<boolean>;
}

// 📄 Schema
const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    fcmToken: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Invalid email"],
    },
    phoneNumber: {
      type: String,
      unique: true,
    },
    dateOfBirth: {
      type: Date,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    userProfile: {
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
    role: {
      type: String,
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "pending"],
      default: function () {
        return this.role === "user" ? "active" : "pending";
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    businessDetail: {
      type: Schema.Types.Mixed,
      default: {},
    },
    contactDetail: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// 🔐 Password Hashing Middleware
userSchema.pre("save", async function (next) {
  const user = this as IUser;
  if (!user.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password!, salt);
    next();
  } catch (err) {
    next(err as any);
  }
});

// 🔍 Password Comparison Method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password!);
};

// 🪪 JWT Method
userSchema.methods.generateJWT = function (): string {
  return jwt.sign({ id: this._id, email: this.email }, config.jwt.secret, {
    expiresIn: "7d",
  });
};

// ✅ Export
export const User = mongoose.model<IUser>("User", userSchema);
