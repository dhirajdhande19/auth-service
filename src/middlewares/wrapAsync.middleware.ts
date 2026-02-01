import { Request, Response, NextFunction } from "express";

export const wrapAsync = <
  T extends (req: Request, res: Response, next: NextFunction) => Promise<any>,
>(
  fn: T,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
