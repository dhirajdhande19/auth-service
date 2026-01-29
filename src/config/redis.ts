import Redis from "ioredis";
const redis = new Redis();
let isRedisOnline = false;

redis.on("error", (e) => {
  isRedisOnline = false;
  console.log({
    message: "Error while connecting to redis",
    status: isRedisOnline,
    details:
      e?.message || "Make sure redis is running from docker (if using docker)",
  });
});

redis.on("connect", () => {
  isRedisOnline = true;
  console.log({ message: "Redis is connected", status: isRedisOnline });
});

export { redis, isRedisOnline };
