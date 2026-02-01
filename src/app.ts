import express from "express";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import authRoutes from "./modules/auth/auth.routes";

app.use("/api/auth", authRoutes);

export default app;
