import { Router } from "express";
import {
  addToCart,
  getCart,
  updateQuantity,
  removeCartItem,
  calculateTotal,
} from "../cart/cart.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

// 🛒 Cart routes wrapped with asyncHandler
router.post("/", authenticateToken, asyncHandler(addToCart));
router.get("/", authenticateToken, asyncHandler(getCart));
router.put("/:productId", authenticateToken, asyncHandler(updateQuantity));
router.delete("/:productId", authenticateToken, asyncHandler(removeCartItem));

export default router;
