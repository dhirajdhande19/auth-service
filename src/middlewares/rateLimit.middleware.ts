import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import RATE_LIMIT_CONFIG, {
  BaseRateLimit,
  RateLimit,
  Routes,
} from "../config/rateLimit";
import { redis } from "../config/redis";
import { logger } from "../utils/logger";

// This middleware implements: Sliding Window Counter Algorithm (for rate limiting)
export const rateLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const route = req.originalUrl;
  try {
    logger.info({ route }, "Rate limit check started");
    logger.info(
      { route },
      req.user?.id ? `userId: ${req.user.id}` : `public ip: ${req.ip}`,
    );

    const routeKey = req.baseUrl as Routes;

    const routeConfig: BaseRateLimit =
      RATE_LIMIT_CONFIG.routes[routeKey] ?? RATE_LIMIT_CONFIG.default;

    const now = Date.now();
    const windowSize = routeConfig.window * 1000; // convert to ms
    const currWindow = Math.floor(now / windowSize);
    const prevWindow = currWindow - 1;

    const baseKey = req.user?.id
      ? `key:api-${req.originalUrl}:userId:${req.user.id}`
      : `key:api-${req.originalUrl}:userId:${req.ip}`;

    const currWindowKey = `${baseKey}:window-${currWindow}`;
    const prevWindowKey = `${baseKey}:window-${prevWindow}`;

    const currCount = await redis.incr(currWindowKey);
    if (currCount === 1) {
      // set key on deltion as soon as its created to double its window size
      await redis.expire(currWindowKey, routeConfig.window * 2);
    }

    let prevCount = (await redis.get(prevWindowKey)) || 0; // prevCount will be null when there are no prev req so we fallback to 0
    if (prevCount != 0) {
      prevCount = Number(prevCount);
    }
    const elapsed = now % windowSize;
    const weight = (windowSize - elapsed) / windowSize;

    const effectiveCount = currCount + prevCount * weight;
    logger.info({ route, currCount, prevCount, effectiveCount });

    if (effectiveCount > routeConfig.limit) {
      logger.error(
        { route, message: "Too Many Request!" },
        "Rate limit check failed",
      );
      return res.status(429).json({ message: "Too Many Request!" });
    }

    logger.info({ route }, "Rate limit check successful");
    next();
  } catch (e: any) {
    logger.error({ route, details: e?.message }, "Rate limit check failed");
    next();
  }
};
