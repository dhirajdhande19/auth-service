import { createServer } from "node:http";
import app from "./app";
import { PORT } from "./config/env";
import { logger } from "./utils/logger";

const server = createServer(app);

server.listen(PORT, () => {
  logger.info(`Running on port: ${PORT}`);
});
