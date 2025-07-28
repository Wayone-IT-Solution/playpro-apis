/**
 * ===============================================
 * 🌐 Auto Route Loader (src/routes/index.ts)
 * ===============================================
 * Loads *.routes.ts from admin/ and public/ folders,
 * preserving folder structure in route path.
 */

import { Router } from "express";
// ADMIN FOLDER
import adminRoutes from "../admin/admin/admin.routes";
import bannerRoutes from "../admin/banner/banner.routes";
// PUBLIC FOLDER
import userRoutes from "../public/user/user.routes";
import stateCityRoutes from "../public/statecity/statecity.routes";
import groundOwner from "../public/groundOwner/ground.routes";
import groundSlot from "../public/slot/slot.routes";

// Create main router
const router = Router();

// Admin routes
router.use("/admin", adminRoutes);

// Banner routes
router.use("/banner", bannerRoutes);

// state-city routes
router.use("/location", stateCityRoutes);

router.use("/user", userRoutes);
router.use("/ground", groundOwner);
router.use("/slot", groundSlot);


export default router;
