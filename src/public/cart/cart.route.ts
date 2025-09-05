import { Router } from "express";
import {
  getCart,
  upsertCartItem,
  removeCartItem,
  getAllCartsForAdmin,
} from "../cart/cart.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";

const router = Router();

// 🛒 Cart routes wrapped with asyncHandler
router.get("/", authenticateToken, asyncHandler(getCart));
router.put("/", authenticateToken, asyncHandler(upsertCartItem));
router.delete("/:productId", authenticateToken, asyncHandler(removeCartItem));
router.get(
  "/admin",
  authenticateToken,
  isAdmin,
  asyncHandler(getAllCartsForAdmin)
);

export default router;
