import { Router } from "express";
import { placeOrder, getMyOrders, getAllOrders } from "../order/order.controller";
import { authenticateToken,  } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();


router.post("/", authenticateToken,asyncHandler(placeOrder));
router.get("/",authenticateToken , asyncHandler(getMyOrders));
router.get("/all",authenticateToken, asyncHandler(getAllOrders));



export default router;
