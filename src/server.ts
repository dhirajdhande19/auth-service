import { createServer } from "node:http";
import app from "./app";
import { PORT } from "./config/env";
import { redis } from "./config/redis";

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Running on port: ${PORT}`);
});
