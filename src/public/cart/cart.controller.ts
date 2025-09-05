import { Request, Response } from "express";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Cart } from "../../modals/cart.model";
import { Product } from "../../modals/product.modal";
import mongoose from "mongoose";
import { CommonService } from "../../services/common.services";

const cartService = new CommonService(Cart);

export const upsertCartItem = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined) {
    throw new ApiError(400, "Product ID and quantity are required");
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // Find or create cart
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [],
      totalAmount: 0,
      finalAmount: 0,
      metaDetail: {},
    });
  }

  // Find item index
  const itemIndex = cart.items.findIndex(
    (item: any) => item.product.toString() === productId
  );

  if (itemIndex > -1) {
    // Product exists → update or remove
    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
  } else {
    // Product not in cart → add if quantity > 0
    if (quantity > 0) {
      cart.items.push({ product: productId, quantity });
    }
  }

  // Recalculate totals
  cart.totalAmount = await calculateTotal(cart);
  cart.finalAmount = cart.totalAmount;

  await cart.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      cart,
      quantity === 0
        ? "Product removed from cart"
        : "Cart updated successfully"
    )
  );
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user.id);
    // console.log((req as any).user.id);

    const cart = await Cart.aggregate([
      { $match: { user: userId } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "brands",
          localField: "product.brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "subcategories",
          localField: "product.subCategory",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },
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
      {
        $group: {
          _id: "$cartId",
          totalAmount: { $first: "$totalAmount" },
          finalAmount: { $first: "$finalAmount" },
          items: { $push: "$item" },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1,
          finalAmount: 1,
          items: 1,
        },
      },
    ]);
    //  console.log(cart);
    res
      .status(200)
      .json(new ApiResponse(200, cart?.[0], "Cart Fetched Successfully!"));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCartsForAdmin = async (req: Request, res: Response) => {
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
      { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "items.product",
        },
      },
      { $unwind: "$items.product" },
      {
        $lookup: {
          from: "categories",
          localField: "items.product.category",
          foreignField: "_id",
          as: "items.product.category",
        },
      },
      {
        $unwind: {
          path: "$items.product.category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "items.product.subCategory",
          foreignField: "_id",
          as: "items.product.subCategory",
        },
      },
      {
        $unwind: {
          path: "$items.product.subCategory",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "items.product.brand",
          foreignField: "_id",
          as: "items.product.brand",
        },
      },
      {
        $unwind: {
          path: "$items.product.brand",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$userDetails" },
          totalAmount: { $first: "$totalAmount" },
          finalAmount: { $first: "$finalAmount" },
          metaDetail: { $first: "$metaDetail" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          items: { $push: "$items" },
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const carts = await cartService.getAll(req.query, pipeline);

    return res
      .status(200)
      .json(new ApiResponse(200, carts, "All carts fetched successfully"));
  } catch (err: any) {
    return res
      .status(500)
      .json(new ApiResponse(500, {}, err.message || "Failed to fetch carts"));
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = cart.items.filter(
    (item: any) => item.product.toString() !== productId
  );

  cart.totalAmount = await calculateTotal(cart);
  cart.finalAmount = cart.totalAmount;

  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Product removed from cart"));
};

export const clearCart = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = [];
  cart.totalAmount = 0;
  cart.finalAmount = 0;

  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart cleared successfully"));
};

export const calculateTotal = async (cart: any) => {
  let total = 0;
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (product) {
      total += product.price * item.quantity;
    }
  }
  return total;
};
