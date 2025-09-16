import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Request, Response, NextFunction } from "express";
import { CommonService } from "../../services/common.services";
import { Application } from "../../modals/application.model";

const applicationService = new CommonService(Application);

export class ApplicationController {
  static async createApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      // Validate or add user info if needed
      req.body.userId = user.id;

      const application = await Application.create(req.body);
      return res.status(201).json(new ApiResponse(201, application, "Application created successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async updateApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await Application.findById(id);
      if (!application) return next(new ApiError(404, "Application not found"));

      // Optional: Check ownership or permissions here

      Object.assign(application, req.body);
      await application.save();

      return res.status(200).json(new ApiResponse(200, application, "Application updated successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await applicationService.getById(req.params.id);
      if (!application) return next(new ApiError(404, "Application not found"));

      return res.status(200).json(new ApiResponse(200, application, "Application fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAllApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const applications = await applicationService.getAll(req.query);
      return res.status(200).json(new ApiResponse(200, applications, "Applications fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async deleteApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const application = await Application.findByIdAndDelete(id);
      if (!application) return next(new ApiError(404, "Application not found"));

      return res.status(200).json(new ApiResponse(200, null, "Application deleted successfully"));
    } catch (err) {
      next(err);
    }
  }

  // Add any filters or status updates specific to applications here

}
