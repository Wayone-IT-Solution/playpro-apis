import Otp from "../../modals/otp.model";
import ApiError from "../../utils/ApiError";
import { config } from "../../config/config";
import { IUser, User } from "../../modals/user.model";
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

// 🚀 Register
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      email,
      role,
      fcmToken,
      lastName,
      password,
      firstName,
      phoneNumber,
      dateOfBirth,
      businessDetail,
      contactDetail,
    } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser)
      res.status(400).json(new ApiError(400, "User already exists"));

    const newUser = await User.create({
      email,
      role,
      status: role !== "user" ? "pending" : "active",
      fcmToken,
      lastName,
      password,
      firstName,
      phoneNumber,
      dateOfBirth,
      businessDetail,
      contactDetail,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newUser, "User registered successfully"));
  } catch (error) {
    next(error);
  }
};

// 🔐 Login
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      throw new ApiError(400, "Please provide both email and password");

    const user: any = await User.findOne({ email }).select("+password");
    if (!user) throw new ApiError(401, "Invalid email or password");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, "Invalid email or password");

    const token = jwt.sign(
      { role: user.role, id: user._id, email: user.email },
      config.jwt.secret,
      {
        expiresIn: "7d",
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, { user, token }, "Login successful"));
  } catch (error) {
    next(error);
  }
};
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userType } = req.params;
    const users = await userService.getAll({ ...req.query, role: userType });
    return res
      .status(200)
      .json(new ApiResponse(200, users, "All users fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// 👤 Get Profile
export const getUserProfile = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const user = await userService.getById(req.user?.id!, false);
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, user, "Profile fetched"));
  } catch (error) {
    next(error);
  }
};

// 🔍 Get by ID
export const getUserById = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params?.id;
    const user = await userService.getById(userId!, false);
    if (!user) throw new ApiError(404, "User not found");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User profile fetched"));
  } catch (error) {
    next(error);
  }
};

// ✏️ Update Profile
export const updateUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const {
      firstName,
      lastName,
      upiId,
      dateOfBirth,
      fcmToken,
      phoneNumber,
      businessDetail,
      contactDetail,
    } = req.body;

    const updatedFields: any = {};
    if (upiId) updatedFields.upiId = upiId;
    if (fcmToken) updatedFields.fcmToken = fcmToken;
    if (lastName) updatedFields.lastName = lastName;
    if (firstName) updatedFields.firstName = firstName;
    if (dateOfBirth) updatedFields.dateOfBirth = dateOfBirth;
    if (phoneNumber) updatedFields.phoneNumber = phoneNumber;
    if (businessDetail) updatedFields.businessDetail = businessDetail;
    if (contactDetail) updatedFields.contactDetail = contactDetail;

    console.log(req.body);
    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) throw new ApiError(404, "User not found");

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "User updated successfully"));
  } catch (error) {
    next(error);
  }
};
export const getAllOtps = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const otps = await otpService.getAll(req.query);
    return res
      .status(200)
      .json(new ApiResponse(200, otps, "All OTPs fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// 📩 Generate OTP
export const generateOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "No user found with this email");

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email },
      { email, expiresAt, otp: otpCode, verified: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`OTP sent to ${email}: ${otpCode}`);
    await sendEmail({
      to: email,
      otp: otpCode,
      userName: `${user?.firstName} ${user?.lastName}`,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "OTP has been sent successfully"));
  } catch (error) {
    next(error);
  }
};

// ✅ Verify OTP
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

    const otpDoc = await Otp.findOne({ email, otp });

    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    if (otpDoc.verified) {
      throw new ApiError(400, "OTP has already been used");
    }

    otpDoc.verified = true;
    await otpDoc.save();

    const user: any = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const payload = { id: user._id, role: "user", email: user.email };
    const secret = config.jwt.secret as string;
    const expiresIn = config.jwt.expiresIn as SignOptions["expiresIn"];

    const token = jwt.sign(payload, secret, { expiresIn });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { token, user },
          "OTP verified successfully. Login complete."
        )
      );
  } catch (error) {
    next(error);
  }
};

// 🖼️ Upload Profile Picture
export const uploadProfilePicture = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const profilePicture = req?.body?.profilePicture?.[0]?.url;

    // if (!profilePicture) throw new ApiError(400, "No file uploaded");

    const record = await userService.getById(userId);
    if (!record) throw new ApiError(404, "User not found.");

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

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { profilePicture: user?.profilePicture },
          "Profile picture updated"
        )
      );
  } catch (error) {
    next(error);
  }
};
// Current user
export const getCurrentUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const user = await User.findById(userId).select("-password");
    if (!user) throw new ApiError(404, "User not found");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Current user fetched successfully"));
  } catch (error) {
    next(error);
  }
};
