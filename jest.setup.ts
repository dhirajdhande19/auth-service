import dotenv from "dotenv";
dotenv.config({ quiet: true });
process.env.NODE_ENV = "test";

// Replace ioredis with ioredis-mock in tests
jest.mock("ioredis", () => require("ioredis-mock"));
