import z from "zod";

export const authUserSchema = z.object({
  email: z.email(),
  password: z.string().min(5),
});
