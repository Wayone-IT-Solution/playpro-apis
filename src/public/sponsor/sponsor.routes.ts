import express from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";
import {
  dynamicUpload,
  s3UploaderMiddleware,
} from "../../middlewares/s3FileUploadMiddleware";
import { SponsorController } from "./sponsor.controller";

const {
  createSponsor,
  getAllSponsors,
  getSponsorById,
  updateSponsorById,
  deleteSponsorById,
  getAllPublicSponsors,
} = SponsorController;

const router = express.Router();

router
  .get("/", authenticateToken, asyncHandler(getAllSponsors))
  .get("/public", asyncHandler(getAllPublicSponsors))
  .post(
    "/",
    authenticateToken,
    dynamicUpload([{ name: "logo", maxCount: 1 }]),
    s3UploaderMiddleware("sponsor"),
    asyncHandler(createSponsor)
  )
  .get("/:id", authenticateToken, asyncHandler(getSponsorById))
  .put(
    "/:id",
    authenticateToken,
    dynamicUpload([{ name: "logo", maxCount: 1 }]),
    s3UploaderMiddleware("sponsor"),
    asyncHandler(updateSponsorById)
  )
  .delete("/:id", authenticateToken, asyncHandler(deleteSponsorById));

export default router;
