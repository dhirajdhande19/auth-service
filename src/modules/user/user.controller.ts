import { Request, Response } from "express";

export const protectedRoutes = async (req: Request, res: Response) => {
  res.status(200).json({ message: "protected routes" });
};

export const adminRoutes = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Admin Routes" });
};

export const otherRoutes = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Other Routes" });
};
