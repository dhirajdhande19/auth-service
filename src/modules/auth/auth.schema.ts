import z from "zod";

export const authUserSchema = z
  .object({
    email: z.email(),
    password: z
      .string()
      .min(5, { message: "Password must be at least 5 chars" })
      .max(30, { message: "Password must be less than or equal to 30 chars" }),
  })
  .required();

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string(),
  })
  .required();
