import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT;

// JWT
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
