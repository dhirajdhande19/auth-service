import { Request, Response, NextFunction } from "express";
import z from "zod";

export const validate =
  (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction) => {
    console.log(`\n-----Zod Validation Start-----\nroute: ${req.originalUrl}`);

    const result = schema.safeParse(req.body);

    if (!result.success) {
      console.log(
        `status: fail\nerror: "Validation error"\ndetails: ${result.error}\n-----Zod Validation End-----\n`,
      );

      return res.status(400).json({
        error: "Validation error",
        details: z.treeifyError(result.error),
      });
    }

    console.log("status: success\n-----Zod Validation End-----\n");
    req.body = result.data;

    next();
  };
