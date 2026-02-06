import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { UserRole } from "../modules/user/user.types";

export const adminRoleMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(`\n-----Role Check Start-----\nroute: ${req.originalUrl}`);
    const userRole = req.user?.role;

    if (!userRole || !(userRole in UserRole)) {
      console.log(`status: fail\n-----Role Check End-----`);
      return res.status(401).json({ error: "Invalid User Role" });
    } else if (userRole != UserRole.Admin) {
      console.log(`status: fail\n-----Role Check End-----`);
      return res.status(401).json({
        error: "Unauthorized",
        details: `Only Admins have access to this route and ur role is ${userRole}`,
      });
    }
    console.log(`status: success\n-----Role Check End-----`);
    next();
  } catch (e: any) {
    console.error(
      `status: fail\nerror: ${e?.message}\n-----Role Check End-----`,
    );
    return res

      .status(401)
      .json({ error: "Invalid Token", details: e?.message });
  }
};
