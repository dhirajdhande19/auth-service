import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET_ACCESS_TOKEN } from "../config/env";

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
  try {
    console.log(`\n-----Auth Check Start-----\nroute: ${req.originalUrl}`);
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      console.log(
        `status: fail\nerror: No Access Token provided\n-----Auth Check End-----`,
      );
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const decodedUser = jwt.verify(accessToken, JWT_SECRET_ACCESS_TOKEN) as {
      email: string;
      id: string;
      role: "User" | "Admin";
    };
    if (!decodedUser) {
      console.log(
        `status: fail\nerror: Could not decode user from jwt\n-----Auth Check End-----`,
      );
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    console.log(`status: success\n-----Auth Check End-----`);
    req.user = decodedUser;
    next();
  } catch (e: any) {
    console.log(`status: fail\nerror: ${e?.message}\n-----Auth Check End-----`);
    return res

      .status(401)
      .json({ message: "Invalid Token", details: e?.message });
  }
};
