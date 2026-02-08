import Router from "express";
import { wrapAsync } from "../../middlewares/wrapAsync.middleware";
import { adminRoutes, otherRoutes, protectedRoutes } from "./user.controller";
import { adminRoleMiddleware } from "../../middlewares/adminRole.Middleware";
const router = Router();

router.get("/protected", wrapAsync(protectedRoutes));
router.get("/admin", adminRoleMiddleware, wrapAsync(adminRoutes));
router.get("/other_routes", wrapAsync(otherRoutes));

export default router;
