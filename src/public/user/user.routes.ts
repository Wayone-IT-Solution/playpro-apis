import { Router } from "express";
import {
  loginUser,
  verifyOtp,
  getAllOtps,
  updateUser,
  getUserById,
  generateOtp,
  registerUser,
  getUserProfile,
  getCurrentUser,
  uploadProfilePicture,
  getAllUsers,
} from "./user.controller";
import { asyncHandler } from "../../utils/asyncHandler";

import {
  isUser,
  isAdmin,
  authenticateToken,
} from "../../middlewares/authMiddleware";
import {
  dynamicUpload,
  s3UploaderMiddleware,
} from "../../middlewares/s3FileUploadMiddleware";

const userRouter = Router();

userRouter.post("/", asyncHandler(registerUser));
userRouter.post("/login", asyncHandler(loginUser));
userRouter.get("/:userType", authenticateToken, asyncHandler(getAllUsers));
userRouter.get("/:userType/:id", authenticateToken, asyncHandler(getUserById));
userRouter.post("/send-otp", asyncHandler(generateOtp));
userRouter.post("/verify-otp", asyncHandler(verifyOtp));
userRouter.put("/", authenticateToken, isUser, asyncHandler(updateUser));
userRouter.put(
  "/profile",
  authenticateToken,
  // isUser,
  dynamicUpload([{ name: "profilePicture", maxCount: 1 }]),
  s3UploaderMiddleware("profile"),
  asyncHandler(uploadProfilePicture)
);
userRouter.get("/", authenticateToken, isUser, asyncHandler(getCurrentUser));

// ✅ Admin Routes
userRouter.get("/otp/all", authenticateToken, asyncHandler(getAllOtps));

userRouter.get("/:id", authenticateToken, isAdmin, asyncHandler(getUserById));

export default userRouter;
