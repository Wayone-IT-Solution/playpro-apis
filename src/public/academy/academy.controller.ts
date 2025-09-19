import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Request, Response, NextFunction } from "express";
import { CommonService } from "../../services/common.services";
import { Academy } from "../../modals/academic.model";

const academyService = new CommonService(Academy);

export class AcademyController {
  static async createAcademy(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      // Validate or add user info if needed
      req.body.userId = user.id;

      const academy = await Academy.create(req.body);
      return res.status(201).json(new ApiResponse(201, academy, "Academy created successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async updateAcademy(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const academy = await Academy.findById(id);
      if (!academy) return next(new ApiError(404, "Academy not found"));

    

      Object.assign(academy, req.body);
      await academy.save();

      return res.status(200).json(new ApiResponse(200, academy, "Academy updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAcademyById(req: Request, res: Response, next: NextFunction) {
    try {
      const academy = await academyService.getById(req.params.id);
      if (!academy) return next(new ApiError(404, "Academy not found"));

      return res.status(200).json(new ApiResponse(200, academy, "Academy fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAllAcademys(req: Request, res: Response, next: NextFunction) {
    try {
      const academys = await academyService.getAll(req.query);
      return res.status(200).json(new ApiResponse(200, academys, "Academys fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async deleteAcademy(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const academy = await Academy.findByIdAndDelete(id);
      if (!academy) return next(new ApiError(404, "Academy not found"));

      return res.status(200).json(new ApiResponse(200, null, "Academy deleted successfully"));
    } catch (err) {
      next(err);
    }
  }

 

}
