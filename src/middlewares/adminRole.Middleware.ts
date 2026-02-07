import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { UserRole } from "../modules/user/user.types";
import { logger } from "../utils/logger";

export const adminRoleMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const route = req.originalUrl;
  try {
    logger.info({ route }, "Role check started");
    const userRole = req.user?.role;

    if (!userRole || !(userRole in UserRole)) {
      logger.error({ route }, "Invalid User Role");
      return res.status(401).json({ error: "Invalid User Role" });
    } else if (userRole != UserRole.Admin) {
      logger.error(
        { route },
        "Unauthorized (Only admins can access this route)",
      );
      return res.status(401).json({
        error: "Unauthorized",
        details: `Only Admins have access to this route and ur role is ${userRole}`,
      });
    }
    logger.info({ route }, "Role check successful");
    next();
  } catch (e: any) {
    logger.error({ route, details: e?.message }, "Role check failed");
    return res

      .status(401)
      .json({ error: "Invalid Token", details: e?.message });
  }
};
