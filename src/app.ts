import express from "express";
const app = express();
import { Request, Response } from "express";
import cookieParser from "cookie-parser";

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import authRoutes from "./modules/auth/auth.routes";
import tokenRoutes from "./modules/token/token.routes";
import userRoutes from "./modules/user/user.routes";

import { authMiddleware } from "./middlewares/auth.middleware";
import { rateLimit } from "./middlewares/rateLimit.middleware";

app.use("/api/auth", rateLimit, authRoutes);
app.use("/api/token", rateLimit, tokenRoutes);
app.use("/api/user", rateLimit, authMiddleware, userRoutes);

app.get("/auth_system", (req: Request, res: Response) => {
  res.status(200).json({ message: "Home Page For Auth System" });
});

export default app;
