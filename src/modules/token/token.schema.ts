import z from "zod";

export const refreshTokenSchema = z
  .object({
    refreshToken: z
      .string()
      .min(10, {
        message: "Refresh Token length should be more than 10 chars",
      }),
  })
  .required();
