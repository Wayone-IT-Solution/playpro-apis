import { Router } from "express";
import {
  addToCart,
  getCart,
  updateQuantity,
  removeCartItem,
  calculateTotal,
  getAllCartsForAdmin,
} from "../cart/cart.controller";
import { authenticateToken, isAdmin } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

// 🛒 Cart routes wrapped with asyncHandler
router.post("/", authenticateToken, asyncHandler(addToCart));
router.get("/", authenticateToken, asyncHandler(getCart));
router.put("/", authenticateToken, asyncHandler(updateQuantity));
router.delete("/:productId", authenticateToken, asyncHandler(removeCartItem));
router.get(
  "/admin",
  authenticateToken,
  isAdmin,
  asyncHandler(getAllCartsForAdmin)
);

export default router;
