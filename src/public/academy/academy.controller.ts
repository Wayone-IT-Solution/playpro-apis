import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Academy } from "../../modals/academic.model";
import { Request, Response, NextFunction } from "express";
import { CommonService } from "../../services/common.services";
import { extractImageUrl } from "../../admin/banner/banner.controller";

const AcademyService = new CommonService(Academy);

// 📌 Create Academy
export const createAcademy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const imageUrl = req?.body?.imageUrl?.[0]?.url;
    if (!imageUrl)
      return res
        .status(403)
        .json(new ApiError(403, "Academy Logo is Required."));

    const Academy = await AcademyService.create({ ...req.body, imageUrl });
    return res
      .status(201)
      .json(new ApiResponse(201, Academy, "Academy created successfully"));
  } catch (err) {
    next(err);
  }
};

// 📌 Get All Academies
export const getAllAcademies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await AcademyService.getAll(req.query);
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Data fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// 📌 Get Academy by ID
export const getAcademyById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const Academy = await AcademyService.getById(req.params.id, false);
    if (!Academy) throw new ApiError(404, "Academy not found");
    return res
      .status(200)
      .json(new ApiResponse(200, Academy, "Academy found"));
  } catch (err) {
    next(err);
  }
};

// 📌 Update Academy
export const updateAcademy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const imageUrl = req?.body?.imageUrl?.[0]?.url;

    const record = await AcademyService.getById(id);
    if (!record) {
      return res.status(404).json(new ApiError(404, "Banner not found."));
    }

    let image;
    if (req?.body?.imageUrl && record.imageUrl)
      image = await extractImageUrl(
        req?.body?.image,
        record.imageUrl as string
      );

    const updated = await AcademyService.updateById(req.params.id, {
      ...req.body,
      imageUrl: image || imageUrl,
    });
    if (!updated) throw new ApiError(404, "Academy not found");
    return res
      .status(200)
      .json(new ApiResponse(200, updated, "Academy updated"));
  } catch (err) {
    next(err);
  }
};

// 📌 Delete Academy
export const deleteAcademy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleted = await AcademyService.deleteById(req.params.id);
    if (!deleted) throw new ApiError(404, "Academy not found");
    return res
      .status(200)
      .json(new ApiResponse(200, deleted, "Academy deleted"));
  } catch (err) {
    next(err);
  }
};
