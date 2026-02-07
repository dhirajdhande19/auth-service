import Redis from "ioredis";
import { logger } from "../utils/logger";
const redis = new Redis();
let isRedisOnline = false;

redis.on("error", (e) => {
  isRedisOnline = false;

  logger.warn(
    {
      status: isRedisOnline,
      details:
        e?.message ||
        "Make sure redis is running from docker (if using docker)",
    },
    "Error while connecting to redis",
  );
});

redis.on("connect", () => {
  isRedisOnline = true;
  logger.info({ status: isRedisOnline }, "Redis is connected");
});

export { redis, isRedisOnline };
