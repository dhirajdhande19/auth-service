import { Request, Response, NextFunction } from "express";
import z from "zod";
import { logger } from "../utils/logger";

export const validate =
  (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const route = req.originalUrl;

    try {
      logger.info({ route }, "Zod validation started");

      const result = schema.safeParse(req.body);

      if (!result.success) {
        logger.error({ route, details: result.error }, "Zod validation failed");

        return res.status(400).json({
          error: "Validation error",
          details: z.treeifyError(result.error),
        });
      }

      logger.info({ route }, "Zod validation succcessful");
      req.body = result.data;

      next();
    } catch (e) {
      logger.error({ route }, "Zod validation failed");
      next();
    }
  };
