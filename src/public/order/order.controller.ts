import { Request, Response } from "express";
import { Cart } from "../../modals/cart.model";
import { Order } from "../../modals/order.model";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import mongoose from "mongoose";
import { CommonService } from "../../services/common.services";

const orderService = new CommonService(Order);

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user.id);
    const cartData = await Cart.aggregate([
      { $match: { user: userId } },

      { $unwind: "$items" },

      // join products
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      // join brand
      {
        $lookup: {
          from: "brands",
          localField: "product.brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

      // join category
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // join subCategory
      {
        $lookup: {
          from: "subcategories",
          localField: "product.subCategory",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },

      // prepare items object
      {
        $project: {
          _id: 0,
          cartId: "$_id",
          totalAmount: 1,
          finalAmount: 1,
          item: {
            brand: "$brand.name",
            name: "$product.name",
            price: "$product.price",
            image: "$product.image",
            productId: "$product._id",
            category: "$category.name",
            quantity: "$items.quantity",
            subCategory: "$subCategory.name",
            description: "$product.description",
          },
        },
      },

      // group back to single cart with items array
      {
        $group: {
          _id: "$cartId",
          totalAmount: { $first: "$totalAmount" },
          finalAmount: { $first: "$finalAmount" },
          items: { $push: "$item" },
        },
      },

      // final shape
      {
        $project: {
          _id: 0,
          totalAmount: 1,
          finalAmount: 1,
          items: 1,
        },
      },
    ]);

    if (!cartData || cartData.length === 0 || cartData[0].items.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    const cart = cartData[0];

    // 3. Create order
    const order = await Order.create({
      ...cart,
      user: userId,
      cart: cart._id,
      paymentMethod: req.body.paymentMethod || "COD",
      paymentStatus: req.body.paymentMethod === "ONLINE" ? "pending" : "paid",
      orderStatus: "pending",
      address: req.body.address,
    });

    // 4. Clear cart
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } },
      { new: true }
    );

    return res
      .status(201)
      .json(new ApiResponse(201, order, "Order placed successfully"));
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode || 500, error.message));
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user.id);

    const orders = await Order.aggregate([
      { $match: { user: userId } },

      { $unwind: "$items" },

      // join products
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      // join brand
      {
        $lookup: {
          from: "brands",
          localField: "product.brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

      // join category
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // join subCategory
      {
        $lookup: {
          from: "subcategories",
          localField: "product.subCategory",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },

      // prepare item
      {
        $project: {
          orderId: "$_id",
          totalAmount: 1,
          finalAmount: 1,
          orderStatus: 1,
          paymentStatus: 1,
          createdAt: 1,
          item: {
            brand: "$brand.name",
            name: "$product.name",
            price: "$product.price",
            image: "$product.image",
            productId: "$product._id",
            category: "$category.name",
            quantity: "$items.quantity",
            subCategory: "$subCategory.name",
            description: "$product.description",
          },
        },
      },

      // group back into one order with items[]
      {
        $group: {
          _id: "$orderId",
          totalAmount: { $first: "$totalAmount" },
          finalAmount: { $first: "$finalAmount" },
          orderStatus: { $first: "$orderStatus" },
          paymentStatus: { $first: "$paymentStatus" },
          createdAt: { $first: "$createdAt" },
          items: { $push: "$item" },
        },
      },

      // shape final response
      {
        $project: {
          _id: 0,
          orderId: "$_id",
          totalAmount: 1,
          finalAmount: 1,
          orderStatus: 1,
          paymentStatus: 1,
          createdAt: 1,
          items: 1,
        },
      },

      { $sort: { createdAt: -1 } },
    ]);

    if (!orders || orders.length === 0) {
      throw new ApiError(404, "No orders found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, orders, "My orders fetched successfully"));
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode || 500, error.message));
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 1,
          items: 1,
          totalAmount: 1,
          finalAmount: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          orderStatus: 1,
          address: 1,
          createdAt: 1,
          updatedAt: 1,
          "userDetails._id": 1,
          "userDetails.firstName": 1,
          "userDetails.lastName": 1,
          "userDetails.email": 1,
          "userDetails.phoneNumber": 1,
        },
      },
    ];

    const response = await orderService.getAll(req.query, pipeline);

    return res
      .status(200)
      .json(new ApiResponse(200, response, "All orders fetched successfully"));
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode || 500, error.message));
  }
};
