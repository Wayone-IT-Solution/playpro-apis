import Otp from "../../modals/otp.model";
import ApiError from "../../utils/ApiError";
import { config } from "../../config/config";
import { User } from "../../modals/user.model";
import jwt, { SignOptions } from "jsonwebtoken";
import ApiResponse from "../../utils/ApiResponse";
import { NextFunction, Request, Response } from "express";
import { CommonService } from "../../services/common.services";
import { extractImageUrl } from "../../admin/banner/banner.controller";
import { sendEmail } from "../../utils/emailService";

interface CustomRequest extends Request {
  user?: { id: string };
}

const otpService = new CommonService(Otp);
const userService = new CommonService(User);

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      email,
      fcmToken,
      lastName,
      password,
      firstName,
      phoneNumber,
      dateOfBirth,
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({
      email,
      fcmToken,
      lastName,
      password,
      firstName,
      phoneNumber,
      dateOfBirth,
    });

    await User.create(newUser);
    res.status(201).json({
      user: newUser,
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.log("Register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await userService.getAll(req.query);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Data fetched successfully"));
  } catch (err) {
    next(err);
  }
};

export const getAllOtps = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await otpService.getAll(req.query);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Data fetched successfully"));
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    const userData: any = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const payload = {
      role: "user",
      id: userData._id,
      email: userData.email,
    };
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: "7d" });
    res.status(200).json({
      user,
      token,
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserProfile = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.id;
  const user = await User.findById(userId).select("-password");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.status(200).json({
    user,
    success: true,
    message: "Profile fetched",
  });
};

export const getUserById = async (req: CustomRequest, res: Response) => {
  const userId = req.params?.id;
  const user = await User.findById(userId).select("-password");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.status(200).json({
    data: user,
    success: true,
    message: "Profile fetched",
  });
};

export const updateUser = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, upiId, dateOfBirth, fcmToken } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updatedFields: any = {};
    if (upiId) updatedFields.upiId = upiId;
    if (fcmToken) updatedFields.fcmToken = fcmToken;
    if (lastName) updatedFields.lastName = lastName;
    if (firstName) updatedFields.firstName = firstName;
    if (dateOfBirth) updatedFields.dateOfBirth = dateOfBirth;

    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    console.log("Update user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const generateOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this phone number",
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    // Save or update OTP
    await Otp.findOneAndUpdate(
      { email },
      {
        email,
        expiresAt,
        otp: otpCode,
        verified: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // TODO: Integrate real SMS service like Twilio or Fast2SMS
    console.log(`OTP sent to ${email}: ${otpCode}`);
    await sendEmail({
      to: email,
      otp: otpCode,
      userName: `${user?.firstName} ${user?.lastName}`,
    });
    return res.status(200).json({
      success: true,
      message: "OTP has been sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const otpDoc = await Otp.findOne({ email, otp });

    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    if (otpDoc.verified) {
      return res.status(400).json({
        success: false,
        message: "OTP has already been used",
      });
    }

    otpDoc.verified = true;
    await otpDoc.save();

    const user: any = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.save();

    const payload = {
      id: user._id,
      role: "user",
      email: user.email,
    };
    const secret = config.jwt.secret as string;
    const expiresIn = config.jwt.expiresIn as SignOptions["expiresIn"];

    const token = jwt.sign(payload, secret, { expiresIn });
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Login complete.",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const changePasswordWithOtp = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord || !otpRecord.verified) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified for this email address",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = newPassword;
    await user.save();

    await Otp.deleteOne({ email });
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const profilePicture = req?.body?.profilePicture[0]?.url;

    if (!profilePicture) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const record = await userService.getById(userId);
    if (!record)
      return res.status(404).json(new ApiError(404, "User not found."));

    let imageUrl;
    if (req?.body?.image && record.profilePicture)
      imageUrl = await extractImageUrl(
        req?.body?.image,
        record.profilePicture as string
      );

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: imageUrl || profilePicture },
      { new: true }
    );

    res.status(200).json({
      success: true,
      profilePicture: user?.profilePicture,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    console.log("Upload error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
