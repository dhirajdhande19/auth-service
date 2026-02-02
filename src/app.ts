import express from "express";
const app = express();
import { Request, Response } from "express";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import authRoutes from "./modules/auth/auth.routes";
import { authMiddleware } from "./middlewares/auth.middleware";

app.use("/api/auth", authRoutes);

// demo (test) route
app.get("/protected", authMiddleware, (req: Request, res: Response) => {
  res.status(200).json("protected data");
});

export default app;
