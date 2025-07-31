import { Request, Response, NextFunction } from "express";
import { Ground } from "../../modals/groundOwner.model";
import ApiError from "../../utils/ApiError";
import { deleteFromS3 } from "../../config/s3Uploader";
import { CommonService } from "../../services/common.services";
import ApiResponse from "../../utils/ApiResponse";

const groundService = new CommonService(Ground);

export class GroundController {
  static async createGround(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      let images = req?.body?.images;
      if (images?.length > 0) {
        images = req?.body?.images?.map((item: any) => item?.url);
      }
      if (!user || user.role !== "ground_owner") {
        return next(new ApiError(403, "Only ground owners can create grounds"));
      }

      const ground = await Ground.create({
        ...req.body,
        images,
        userId: user.id,
      });

      return res.status(201).json({ message: "Ground created", data: ground });
    } catch (err) {
      next(err);
    }
  }

  static async updateGround(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      let images = req?.body?.images;
      if (images?.length > 0) {
        images = req?.body?.images?.map((item: any) => item?.url);
      }
      const ground = await Ground.findById(id);
      if (!ground) return next(new ApiError(404, "Ground not found"));

      if (ground.userId.toString() !== user.id.toString()) {
        return next(
          new ApiError(403, "You are not authorized to update this ground")
        );
      }
      const existingImages = ground?.images;
      req.body.images = [...existingImages, ...images];
      Object.assign(ground, req.body);
      await ground.save();

      return res.status(200).json({ message: "Ground updated", data: ground });
    } catch (err) {
      next(err);
    }
  }

  static async searchGrounds(req: Request, res: Response, next: NextFunction) {
    try {
      const { minPrice, maxPrice, lat, lng } = req.query;
      const filter: any = {};

      if (minPrice && maxPrice) {
        filter.pricePerHour = {
          $gte: Number(minPrice),
          $lte: Number(maxPrice),
        };
      }

      if (lat && lng) {
        filter.location = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(lng), Number(lat)],
            },
            $maxDistance: 10000,
          },
        };
      }

      const grounds = await Ground.find(filter);
      res.status(200).json({ data: grounds });
    } catch (err) {
      next(err);
    }
  }

  static async getGroundById(req: Request, res: Response, next: NextFunction) {
    try {
      const ground = await groundService.getById(req.params.id);
      if (!ground) return next(new ApiError(404, "Ground not found"));
      res
        .status(200)
        .json(new ApiResponse(200, ground, "Data fetched successfully!"));
    } catch (err) {
      next(err);
    }
  }

  static async getMyGrounds(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const grounds = await groundService.getAll({
        userId: user.id,
        ...req.query,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, grounds, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async getAllGrounds(req: Request, res: Response, next: NextFunction) {
    try {
      const pipeline = [
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userData",
          },
        },
        { $unwind: "$userData" },
        {
          $project: {
            _id: 1,
            name: 1,
            status: 1,
            address: 1,
            updatedAt: 1,
            createdAt: 1,
            pricePerHour: 1,
            description: 1,
            email: "$userData.email",
            lastName: "$userData.lastName",
            firstName: "$userData.firstName",
            mobile: "$userData.phoneNumber",
          },
        },
      ];
      const grounds = await groundService.getAll(req.query, pipeline);
      return res
        .status(200)
        .json(new ApiResponse(200, grounds, "Data fetched successfully"));
    } catch (err) {
      next(err);
    }
  }

  static async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { groundId, key } = req.body;
      const user = (req as any).user;

      const ground = await Ground.findById(groundId);
      if (!ground)
        return res.status(404).json(new ApiError(404, "Ground not found"));

      if (ground.userId.toString() !== user.id.toString()) {
        return res
          .status(403)
          .json(
            new ApiError(403, "Not authorized to delete image from this ground")
          );
      }
      const imageIndex = ground.images.findIndex((img: string) =>
        img.includes(key)
      );
      if (imageIndex === -1) {
        return res
          .status(404)
          .json(new ApiError(404, "Image not found in ground"));
      }
      ground.images.splice(imageIndex, 1);
      await ground.save();

      await deleteFromS3(key);

      return res.status(200).json({ message: "Image deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}
