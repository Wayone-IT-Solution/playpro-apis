import { Router } from "express";
import {
  deleteSlot,
  createSlots,
  addMoreSlots,
  getSlotsByDate,
  getNextDaysSlots,
} from "../slot/slot.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticateToken, asyncHandler(getSlotsByDate));
router.get("/:id", authenticateToken, asyncHandler(getNextDaysSlots));
router.post("/", authenticateToken, asyncHandler(createSlots));
router.delete("/", authenticateToken, asyncHandler(deleteSlot));
router.post("/add", authenticateToken, asyncHandler(addMoreSlots));

export default router;