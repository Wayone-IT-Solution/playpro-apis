import { Request, Response, NextFunction } from "express";
import { Ground } from "../../modals/groundOwner.model";
import ApiError from "../../utils/ApiError";
import { deleteFromS3 } from "../../config/s3Uploader";

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
      const ground = await Ground.findById(req.params.id);
      if (!ground) return next(new ApiError(404, "Ground not found"));

      res.status(200).json({ data: ground });
    } catch (err) {
      next(err);
    }
  }

  static async getMyGrounds(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const grounds = await Ground.find({ userId: user.id });
      res.status(200).json({ data: grounds });
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
