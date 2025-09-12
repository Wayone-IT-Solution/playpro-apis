import mongoose from "mongoose";
import ApiError from "../../utils/ApiError";
import { Request, Response } from "express";
import { Cart } from "../../modals/cart.model";
import { Order } from "../../modals/order.model";
import ApiResponse from "../../utils/ApiResponse";
import { CommonService } from "../../services/common.services";
import { Coupon, CouponStatus, CouponType } from "../../modals/coupon.model";

const orderService = new CommonService(Order);

// ---------------- Apply Coupon ----------------
export const applyCoupon = async (req: Request, res: Response) => {
  try {
    const { orderId, couponCode } = req.body;

    if (!orderId || !couponCode) {
      throw new ApiError(400, "Order ID and Coupon Code are required");
    }

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");

    if (order.orderStatus !== "pending")
      throw new ApiError(400, "Coupon can only be applied on pending orders");

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) throw new ApiError(404, "Invalid coupon code");

    // ✅ Validate coupon
    const now = new Date();
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new ApiError(400, "Coupon is not active");
    }
    if (coupon.startDate > now) {
      throw new ApiError(400, "Coupon is not yet valid");
    }
    if (coupon.endDate < now) {
      throw new ApiError(400, "Coupon has expired");
    }
    if (coupon.minBookingAmount && order.totalAmount < coupon.minBookingAmount) {
      throw new ApiError(400, `Minimum order amount should be SAR${coupon.minBookingAmount}`);
    }

    // ✅ Calculate discount
    let discountAmount = 0;
    if (coupon.type === CouponType.FLAT) {
      discountAmount = coupon.discountValue;
    } else if (coupon.type === CouponType.PERCENTAGE) {
      discountAmount = (order.totalAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    }

    // ✅ Update order
    order.discountAmount = discountAmount;
    order.finalAmount = order.totalAmount - discountAmount;
    order.couponId = coupon._id as any;
    await order.save();

    return res
      .status(200)
      .json(new ApiResponse(200, order, "Coupon applied successfully"));
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode || 500, error.message));
  }
};

// ---------------- Remove Coupon ----------------
export const removeCoupon = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) throw new ApiError(400, "Order ID is required");

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");

    if (order.orderStatus !== "pending")
      throw new ApiError(400, "Coupon can only be removed from pending orders");

    // Reset coupon fields
    order.discountAmount = 0;
    order.finalAmount = order.totalAmount;
    order.couponId = undefined as any;
    await order.save();

    return res
      .status(200)
      .json(new ApiResponse(200, order, "Coupon removed successfully"));
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode || 500, error.message));
  }
};

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

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const result = await orderService.getById(req.params.id);
    if (!result)
      return res.status(404).json(new ApiError(404, "banner not found"));
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Data fetched successfully"));
  } catch (err: any) {
    return res.status(500).json(new ApiError(500, err.message));
  }
}

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

export const getAllOrdersForAdmin = async (req: Request, res: Response) => {
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
