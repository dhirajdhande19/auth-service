import { createServer } from "node:http";
import app from "./app";
import { PORT } from "./config/env";
import { redis } from "./config/redis";

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Running on port: ${PORT}`);
});

// just to test and make sure redis connection was success.
const demo = async (): Promise<string> => {
  await redis.set("key", "value");
  const val = await redis.get("key");
  if (!val) {
    return "null";
  }
  return val;
};

console.log(demo);
