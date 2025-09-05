import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken, isAdmin, } from "../../middlewares/authMiddleware";
import { placeOrder, getMyOrders, getOrderById, getAllOrders, getAllOrdersForAdmin } from "../order/order.controller";

const router = Router();

router.post("/", authenticateToken, asyncHandler(placeOrder));
router.get("/", authenticateToken, asyncHandler(getMyOrders));
router.get("/all", authenticateToken, asyncHandler(getAllOrders));
router.get("/admin", authenticateToken, isAdmin, asyncHandler(getAllOrdersForAdmin));
router.get("/admin/:id", authenticateToken, isAdmin, asyncHandler(getOrderById));
router.get("/:id", authenticateToken, asyncHandler(getOrderById));

export default router;
