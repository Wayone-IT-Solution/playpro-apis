/**
 * ===============================================
 * 🌐 Centralized Route Loader (src/routes/index.ts)
 * ===============================================
 * Loads and registers all application routes.
 * Each module is mounted under its respective path.
 * ===============================================
 */

import { Router } from "express";

// ===============================
// Admin Routes
// ===============================
import adminRoutes from "../admin/admin/admin.routes";
import roleRoutes from "../admin/role/role.routes";
import bannerRoutes from "../admin/banner/banner.routes";

// ===============================
// Public Routes
// ===============================
import blog from "../public/blog/blog.route";
import cart from "../public/cart/cart.route";
import order from "../public/order/order.route";
import brand from "../public/brand/brand.routes";
import review from "../public/review/review.route";
import userRoutes from "../public/user/user.routes";
import groundSlot from "../public/slot/slot.routes";
import booking from "../public/booking/booking.route";
import product from "../public/product/product.route";
import category from "../public/category/category.route";
import contact from "../public/contactUs/contactUs.router";
import groundOwner from "../public/groundOwner/ground.routes";
import stateCityRoutes from "../public/statecity/statecity.routes";
import testimonial from "../public/testimonial/testimonial.routes";
import productCategory from "../public/productCategory/productCategory.route";

// ===============================
// Dashboard Routes
// ===============================
import revenue from "../dashboard/router/revenue.route";

// ===============================
// Initialize Main Router
// ===============================
const router = Router();

// ---------- Admin ----------
router.use("/role", roleRoutes);
router.use("/admin", adminRoutes);
router.use("/banner", bannerRoutes);

// ---------- Public ----------
router.use("/blog", blog);
router.use("/cart", cart);
router.use("/order", order);
router.use("/brand", brand);
router.use("/review", review);
router.use("/user", userRoutes);
router.use("/slot", groundSlot);
router.use("/booking", booking);
router.use("/product", product);
router.use("/category", category);
router.use("/contact", contact);
router.use("/ground", groundOwner);
router.use("/testimonial", testimonial);
router.use("/location", stateCityRoutes);
router.use("/product-category", productCategory);

// ---------- Dashboard ----------
router.use("/revenue", revenue);

export default router;
