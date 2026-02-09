import { redis } from "../../src/config/redis";
import { UserRole } from "../../src/modules/user/user.types";

import {
  authenticateUser,
  createUser,
} from "../../src/modules/auth/local/localAuth.service";
import bcrypt from "bcryptjs";

let userData: any = {
  email: "test@email.com",
  password: "12345",
  role: UserRole.User,
  id: "12345",
  provider: "local",
};

// register user
describe("Register Unit Test", () => {
  beforeEach(async () => {
    await redis.flushall();
  });

  test("should return 201", async () => {
    const result = await createUser(userData);
    expect(result).toBe(201);
  });
  test("should return 409 - duplicate email (conflict)", async () => {
    await redis.hset(`user: ${userData.email}`, userData);
    const result = await createUser(userData);
    expect(result).toBe(409);
  });
  test("should return 400 - empty email || password", async () => {
    const result = await createUser({ ...userData, email: "", password: "" });
    expect(result).toBe(400);
  });
});

// login user
describe("Login Unit Test", () => {
  beforeEach(async () => {
    await redis.flushall();
  });

  test(`should return {'accessToken', 'refreshToken'}`, async () => {
    let hashedPassword = await bcrypt.hash("12345", 10);
    await redis.hset(`user: ${userData.email}`, {
      ...userData,
      password: hashedPassword,
    });
    const tokens = await authenticateUser({
      email: userData.email,
      password: "12345",
    });
    expect(tokens).toBeInstanceOf(Object);
    // and/or
    expect(tokens).not.toEqual({}); // should not be empty obj
    // and/or
    expect(Object.keys(tokens).length).toBeGreaterThan(0);
    // and/or
    expect(tokens).toHaveProperty("accessToken");
    expect(tokens).toHaveProperty("refreshToken");
  });
  test(`should return 404 - wrong email & correct password`, async () => {
    let hashedPassword = await bcrypt.hash("12345", 10);
    await redis.hset(`user: ${userData.email}`, {
      ...userData,
      password: hashedPassword,
    });

    const result = await authenticateUser({
      email: "user@email.com",
      password: hashedPassword,
    });
    expect(result).toBe(404);
  });
  test("should return 401 - correct email & wrong password", async () => {
    let hashedPassword = await bcrypt.hash("12345", 10);
    await redis.hset(`user: ${userData.email}`, {
      ...userData,
      password: hashedPassword,
    });
    const result = await authenticateUser({
      email: userData.email,
      password: "54321", // wrong password
    });
    expect(result).toBe(401);
  });
});

// close redis when all tests are done
afterAll(async () => {
  await redis.quit();
});
