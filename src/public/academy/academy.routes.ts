import { Router } from "express";
import {
    createAcademy,
    updateAcademy,
    deleteAcademy,
    getAcademyById,
    getAllAcademies,
} from "./academy.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticateToken } from "../../middlewares/authMiddleware";
import { dynamicUpload, s3UploaderMiddleware } from "../../middlewares/s3FileUploadMiddleware";

const router = Router();

router.post(
    "/",
    authenticateToken,
    dynamicUpload([{ name: "imageUrl", maxCount: 1 }]),
    s3UploaderMiddleware("academy"),
    asyncHandler(createAcademy));
router.get("/", authenticateToken, asyncHandler(getAllAcademies));
router.put(
    "/:id",
    authenticateToken,
    dynamicUpload([{ name: "imageUrl", maxCount: 1 }]),
    s3UploaderMiddleware("academy"),
    asyncHandler(updateAcademy));
router.get("/:id", authenticateToken, asyncHandler(getAcademyById));
router.delete("/:id", authenticateToken, asyncHandler(deleteAcademy));

export default router;
