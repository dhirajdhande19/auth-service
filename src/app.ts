import express from "express";
const app = express();
import { Request, Response } from "express";
import cookieParser from "cookie-parser";

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import authRoutes from "./modules/auth/auth.routes";
import tokenRoutes from "./modules/token/token.routes";
import { authMiddleware } from "./middlewares/auth.middleware";
import { adminRoleMiddleware } from "./middlewares/adminRole.Middleware";
import { rateLimit } from "./middlewares/rateLimit.middleware";

app.use("/api/auth", rateLimit, authRoutes);
app.use("/api/token", rateLimit, tokenRoutes);

// demo (test) route
app.get("/protected", authMiddleware, (req: Request, res: Response) => {
  res.status(200).json({ message: "protected data" });
});

app.get("/auth_system", (req: Request, res: Response) => {
  res.status(200).json({ message: "Home Page For Auth System" });
});

/*
 adminRoleMiddleware is used when we have to rejct all user requests, unless the role is Admin
 so, 
 if(role != Admin) {
  reject request
 } else proccess request

 **Imp Note:** It's necessary that we use authMiddleware before calling adminRoleMiddleware
*/

app.get(
  "/admin",
  authMiddleware,
  adminRoleMiddleware,
  (req: Request, res: Response) => {
    res.status(200).json({ message: "Admin Routes" });
  },
);
app.get("/other_routes", authMiddleware, (req: Request, res: Response) => {
  res.status(200).json({ message: "Other Routes" });
});

export default app;
