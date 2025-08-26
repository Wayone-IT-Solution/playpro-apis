import { Request, Response } from "express";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { Cart } from "../../modals/cart.model";
import { Product } from "../../modals/product.modal";
import mongoose from "mongoose";

/**
 * 🛒 Add product to cart
 */
export const addToCart = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined) {
    throw new ApiError(400, "Product ID and quantity are required");
  }

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  // ✅ always use `user` field instead of `userId`
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({
      user: userId, // ✅ correct field name
      items: [],
      totalAmount: 0,
      finalAmount: 0,
      metaDetail: {},
    });
  }

  const existingItemIndex = cart.items.findIndex(
    (item: any) => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    if (quantity === 0) {
      cart.items.splice(existingItemIndex, 1); // remove if 0
    } else {
      cart.items[existingItemIndex].quantity = quantity; // update qty
    }
  } else {
    if (quantity > 0) {
      cart.items.push({ product: productId, quantity });
    }
  }

  cart.totalAmount = await calculateTotal(cart);
  cart.finalAmount = cart.totalAmount;

  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Product added to cart"));
};

/**
 * 🛒 Get user cart
 */
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user.id);

    const cart = await Cart.aggregate([
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

    res
      .status(200)
      .json(new ApiResponse(200, cart?.[0], "Cart Fetched Successfully!"));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 🛒 Remove product from cart
 */
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

/**
 * 🛒 Update quantity
 */
export const updateQuantity = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { productId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  const itemIndex = cart.items.findIndex(
    (i: any) => i.product.toString() === productId
  );
  if (itemIndex === -1) throw new ApiError(404, "Product not in cart");

  if (quantity === 0) {
    cart.items.splice(itemIndex, 1); // remove if 0
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  cart.totalAmount = await calculateTotal(cart);
  cart.finalAmount = cart.totalAmount;

  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart updated successfully"));
};

/**
 * 🛒 Clear entire cart
 */
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

/**
 * 🛒 Calculate total (helper)
 */
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
