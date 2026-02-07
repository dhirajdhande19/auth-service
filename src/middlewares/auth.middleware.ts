import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET_ACCESS_TOKEN } from "../config/env";
import { logger } from "../utils/logger";

// coz we need to set req.user = user (by default ts will give err so we improvise)
export interface AuthRequest extends Request {
  user?: {
    email: string;
    id: string;
    role: "User" | "Admin";
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const route = req.originalUrl;
  try {
    logger.info({ route }, "Auth check started");
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      logger.warn({ route }, "No access token provided");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decodedUser = jwt.verify(accessToken, JWT_SECRET_ACCESS_TOKEN) as {
      email: string;
      id: string;
      role: "User" | "Admin";
    };
    if (!decodedUser) {
      logger.warn({ route }, "Could not decode user from jwt");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    logger.info({ route, userId: decodedUser.id }, "Auth check successful");

    req.user = decodedUser;
    next();
  } catch (e: any) {
    logger.error({ route, error: e?.message }, "Invalid or expired token");

    return res

      .status(401)
      .json({ error: "Invalid Token", details: e?.message });
  }
};
