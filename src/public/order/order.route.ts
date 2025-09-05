import { Router } from "express";
import { placeOrder, getMyOrders, getAllOrders, getAllOrdersForAdmin } from "../order/order.controller";
import { authenticateToken, isAdmin,  } from "../../middlewares/authMiddleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();


router.post("/", authenticateToken,asyncHandler(placeOrder));
router.get("/",authenticateToken , asyncHandler(getMyOrders));
router.get("/all",authenticateToken, asyncHandler(getAllOrders));
router.get("/admin", authenticateToken,isAdmin,asyncHandler(getAllOrdersForAdmin));



export default router;
