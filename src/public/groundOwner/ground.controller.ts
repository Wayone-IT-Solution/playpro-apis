import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { deleteFromS3 } from "../../config/s3Uploader";
import { Request, Response, NextFunction } from "express";
import { CommonService } from "../../services/common.services";
import { deepUnflatten, Ground } from "../../modals/ground.model";

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

      req.body = deepUnflatten({
        images,
        ...req.body,
        userId: user.id,
      })
      const ground = await Ground.create(req.body);
      return res
        .status(201)
        .json({ success: true, message: "Ground created", data: ground });
    } catch (err) {
      next(err);
    }
  }

  static async createGroundByAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const newImages = req?.body?.images?.map((item: any) => item?.url) || [];
      const ground = await Ground.create({
        ...req.body,
        images: newImages,
        location: {
          type: "Point",
          coordinates: [
            parseFloat(req.body.latitude),
            parseFloat(req.body.longitude),
          ],
        },
      });
      return res
        .status(201)
        .json(new ApiResponse(201, ground, "Ground Listed Successfully!"));
    } catch (err) {
      next(err);
    }
  }

  static async updateGround(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      let images = req?.body?.images;
      // Normalize images (string URLs + object URLs)
      if (Array.isArray(images) && images.length > 0) {
        images = images.map((item: any) =>
          typeof item === "string" ? item : item?.url
        );
      } else images = [];
      const ground = await Ground.findById(id);
      if (!ground) return next(new ApiError(404, "Ground not found"));

      if (ground.userId.toString() !== user.id.toString()) {
        return next(
          new ApiError(403, "You are not authorized to update this ground")
        );
      }
      const existingImages = ground?.images;
      const mergedImages = [...existingImages, ...images].filter(
        (value, index, self) => self.indexOf(value) === index
      );
      req.body.images = mergedImages;
      req.body = deepUnflatten(req.body)
      Object.assign(ground, req.body);
      await ground.save();

      return res
        .status(200)
        .json({ success: true, message: "Ground updated", data: ground });
    } catch (err) {
      next(err);
    }
  }

  static async updateGroundByAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      let images = req?.body?.images;

      // Normalize images (string URLs + object URLs)
      if (Array.isArray(images) && images.length > 0) {
        images = images.map((item: any) =>
          typeof item === "string" ? item : item?.url
        );
      } else images = [];
      const ground = await Ground.findById(id);
      if (!ground) return next(new ApiError(404, "Ground not found"));

      req.body.images = images;
      if (req.body.latitude && req.body.longitude) {
        req.body.location = {
          type: "Point",
          coordinates: [
            parseFloat(req.body.latitude),
            parseFloat(req.body.longitude),
          ],
        };
        delete req.body.latitude;
        delete req.body.longitude;
      }
      const existingImages = ground?.images;
      const mergedImages = [...existingImages, ...images].filter(
        (value, index, self) => self.indexOf(value) === index
      );

      req.body.images = mergedImages;
      req.body = deepUnflatten(req.body)
      Object.assign(ground, req.body);
      await ground.save();

      return res
        .status(200)
        .json({ success: true, message: "Ground updated", data: ground });
    } catch (err) {
      next(err);
    }
  }

  static async searchGrounds(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        minPrice,
        maxPrice,
        lat,
        lng,
        name,
        address,
        facilities,
        page = 1,
        limit = 10,
      } = req.query;

      const filter: any = {
        status: "active",
      };

      if (minPrice && maxPrice) {
        filter.pricePerHour = {
          $gte: Number(minPrice),
          $lte: Number(maxPrice),
        };
      }

      if (lat && lng) {
        filter.location = {
          $geoWithin: {
            $centerSphere: [[Number(lng), Number(lat)], 10 / 6378.1],
          },
        };
      }

      if (name) {
        filter.name = { $regex: name as string, $options: "i" };
      }

      if (address) {
        filter.address = { $regex: address as string, $options: "i" };
      }

      if (facilities) {
        const facilitiesArray = Array.isArray(facilities)
          ? facilities
          : (facilities as string).split(",");
        filter.facilities = { $all: facilitiesArray };
      }

      const totalCount = await Ground.countDocuments(filter);

      const skip = (Number(page) - 1) * Number(limit);
      const grounds = await Ground.find(filter).skip(skip).limit(Number(limit));

      res.status(200).json({
        result: grounds,
        pagination: {
          currentPage: Number(page),
          itemsPerPage: Number(limit),
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getGroundById(req: Request, res: Response, next: NextFunction) {
    try {
      const ground: any = await groundService.getById(req.params.id, false);
      if (!ground) return next(new ApiError(404, "Ground not found"));
      const data = {
        ...ground.toJSON(),
        latitude: ground.location.coordinates[0],
        longitude: ground.location.coordinates[1],
      };
      return res
        .status(200)
        .json(new ApiResponse(200, data, "Data fetched successfully!"));
    } catch (err) {
      next(err);
    }
  }

  static async getGroundDetailsById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ground = await Ground.findOne({
        _id: req.params.id,
        status: "active",
      });
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
            type: 1,
            status: 1,
            images: 1,
            address: 1,
            pitchType: 1,
            updatedAt: 1,
            createdAt: 1,
            description: 1,
            pricePerHour: 1,
            email: "$userData.email",
            lastName: "$userData.lastName",
            mobile: "$userData.phoneNumber",
            firstName: "$userData.firstName",
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

  static async getAllAdminGrounds(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
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
            email: "$userData.email",
            lastName: "$userData.lastName",
            firstName: "$userData.firstName",
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

  static async getAllPublicGround(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await groundService.getAll({
        ...req.query,
        status: "active",
      });
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Grounds fetched successfully"));
    } catch (err) {
      next(err);
    }
  }
  static async getGroundFilters(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const statusFilter = { status: "active" };

      const names = await Ground.distinct("name", statusFilter);
      const types = await Ground.distinct("type", statusFilter);
      const addresses = await Ground.distinct("city", statusFilter);
      const facilities = await Ground.distinct("facilities", statusFilter);

      const priceStats = await Ground.aggregate([
        { $match: statusFilter },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$pricePerHour" },
            maxPrice: { $max: "$pricePerHour" },
          },
        },
        {
          $project: {
            _id: 0,
            minPrice: 1,
            maxPrice: 1,
          },
        },
      ]);

      const { minPrice = 0, maxPrice = 0 } = priceStats[0] || {};

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            names,
            types,
            addresses,
            facilities,
            minPrice,
            maxPrice,
          },
          "Filter data fetched successfully"
        )
      );
    } catch (err) {
      next(err);
    }
  }

  static async filterGrounds(req: Request, res: Response, next: NextFunction) {
    try {
      const statusFilter = { status: "active" };
      const { name, type, city, address, facility, minPrice, maxPrice } = req.query;

      const filter: any = { ...statusFilter };

      if (name) {
        filter.$or = [
          { "name.en": { $regex: name, $options: "i" } },
          { "name.ar": { $regex: name, $options: "i" } },
        ];
      }
      if (city) {
        filter.$or = [
          { "city.en": { $regex: city, $options: "i" } },
          { "city.ar": { $regex: city, $options: "i" } },
        ];
      }
      if (type) {
        filter.$or = [
          { "type.en": { $regex: type, $options: "i" } },
          { "type.ar": { $regex: type, $options: "i" } },
        ];
      }
      if (address) {
        filter.$or = [
          { "address.en": { $regex: address, $options: "i" } },
          { "address.ar": { $regex: address, $options: "i" } },
        ];
      }
      if (facility) filter.facilities = { $regex: facility, $options: "i" };

      if (minPrice || maxPrice) {
        filter.pricePerHour = {};
        if (minPrice) filter.pricePerHour.$gte = Number(minPrice);
        if (maxPrice) filter.pricePerHour.$lte = Number(maxPrice);
      }

      const grounds = await Ground.find(filter).exec();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            grounds,
            "Grounds fetched successfully based on filters"
          )
        );
    } catch (err) {
      next(err);
    }
  }

  static async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { groundId, key } = req.body;
      const ground = await Ground.findById(groundId);
      if (!ground)
        return res.status(404).json(new ApiError(404, "Ground not found"));

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

  static async getGroundCountByType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await Ground.aggregate([
        { $match: { status: "active" } },
        {
          $group: {
            _id: null,
            counts: {
              $push: {
                en: "$type.en",
                ar: "$type.ar",
              },
            },
          },
        },
        { $unwind: "$counts" },
        {
          $group: {
            _id: { en: "$counts.en", ar: "$counts.ar" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            type_en: "$_id.en",
            type_ar: "$_id.ar",
            count: 1,
          },
        },
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Ground count by type (EN & AR separated) fetched successfully"
          )
        );
    } catch (err) {
      next(err);
    }
  }
}
