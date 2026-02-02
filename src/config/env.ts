import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT;

// JWT

// Access Token JWT Config
export const JWT_SECRET_ACCESS_TOKEN = process.env
  .JWT_SECRET_ACCESS_TOKEN as string;
export const JWT_EXPIRES_IN_ACCESS_TOKEN = process.env
  .JWT_EXPIRES_IN_ACCESS_TOKEN as string;

// Refresh Token JWT Config
export const JWT_SECRET_REFRESH_TOKEN = process.env
  .JWT_SECRET_REFRESH_TOKEN as string;
export const JWT_EXPIRES_IN_REFRESH_TOKEN = process.env
  .JWT_EXPIRES_IN_REFRESH_TOKEN as string;

// redis expire refresh token(in days)
export const REDIS_EXPIRE_REFRESH_TOKEN =
  process.env.REDIS_EXPIRE_REFRESH_TOKEN;
