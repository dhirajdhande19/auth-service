import dotenv from "dotenv";
dotenv.config({ quiet: true });

// Replace ioredis with ioredis-mock in tests
jest.mock("ioredis", () => require("ioredis-mock"));
