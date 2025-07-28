import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { config } from "../config/config";
import mongoose, { Document, Schema } from "mongoose";

// 🔒 Interface
export interface IUser extends Document {
  email: string;
  upiId: string;
  points: number;
  lastName: string;
  password: string;
  fcmToken?: string;
  firstName: string;
  dateOfBirth: Date;
  phoneNumber: string;
  generateJWT(): string;
  profilePicture?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
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
      unique: true, // ✅ This already creates a unique index
      lowercase: true,
      validate: [validator.isEmail, "Invalid email"],
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true, // ✅ This already creates a unique index
      validate: {
        validator: (val: string) => /^[6-9]\d{9}$/.test(val),
        message: "Invalid Indian mobile number",
      },
    },
    upiId: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
      validate: {
        validator: (date: Date) => date < new Date(),
        message: "Date of birth must be in the past",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    points: {
      type: Number,
      default: 0,
    },
    profilePicture: {
      type: String,
    },
  },
  { timestamps: true }
);

// 🔐 Password Hash Middleware
userSchema.pre("save", async function (next) {
  const user = this as IUser;
  if (!user.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

// ✅ Compare Password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 🪪 Generate JWT
userSchema.methods.generateJWT = function (): string {
  return jwt.sign({ id: this._id, email: this.email }, config.jwt.secret, {
    expiresIn: "7d",
  });
};

// ✅ Export
export const User = mongoose.model<IUser>("User", userSchema);
