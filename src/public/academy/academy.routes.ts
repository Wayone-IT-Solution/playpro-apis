import { Router } from "express";
import {
    createAcademy,
    updateAcademy,
    deleteAcademy,
    getAcademyById,
    getAllAcademies,
    getAcademyPublicById,
    getAllPublicAcademies
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
router.get("/public", asyncHandler(getAllPublicAcademies));
router.put(
    "/:id",
    authenticateToken,
    dynamicUpload([{ name: "imageUrl", maxCount: 1 }]),
    s3UploaderMiddleware("academy"),
    asyncHandler(updateAcademy));
router.get("/:id", authenticateToken, asyncHandler(getAcademyById));
router.get("/public/:id", asyncHandler(getAcademyPublicById));
router.delete("/:id", authenticateToken, asyncHandler(deleteAcademy));

export default router;
