import express from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { RegistrationController } from "./registration.controller";
import { authenticateToken } from "../../middlewares/authMiddleware";
const {
  createRegistration,
  getRegistrationById,
  getAllRegistrations,
  updateRegistrationById,
  deleteRegistrationById,
} = RegistrationController;

const router = express.Router();

router
  .post("/", asyncHandler(createRegistration))
  .get("/", authenticateToken, asyncHandler(getAllRegistrations))
  .get("/:id", authenticateToken, asyncHandler(getRegistrationById))
  .put("/:id", authenticateToken, asyncHandler(updateRegistrationById))
  .delete("/:id", authenticateToken, asyncHandler(deleteRegistrationById));

export default router;
