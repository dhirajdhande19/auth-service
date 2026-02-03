// unit testing for auth

import { redis } from "../../src/config/redis";
import {
  authenticateUser,
  createUser,
  verifyRefreshTokenAndGetAccessToken,
} from "../../src/modules/auth/auth.service";

const email = "test@gmail.com";
const password = "12345";

beforeAll(async () => {
  await redis.flushall(); // clears all keys
});

test("register user: Should return 201", async () => {
  const result = await createUser({ email, password });
  expect(result).toBe(201);
});

test("register user: Should return 409", async () => {
  const result = await createUser({ email, password });
  expect(result).toBe(409); // failure reason: same email
});

test("login user: Should return object (accessToken, refreshToken)", async () => {
  // login
  const tokens = await authenticateUser({ email, password });
  expect(tokens).toBeInstanceOf(Object);
  // or/and
  expect(Object.keys(tokens).length).toBeGreaterThan(0);
  // or/and
  expect(tokens).not.toEqual({});
  // or/and
  expect(tokens).toHaveProperty("accessToken");
  expect(tokens).toHaveProperty("refreshToken");
});

test("login user: Should return 401 - wrong password", async () => {
  const result = await authenticateUser({ email, password: "54321" });
  expect(result).toBe(401);
});

test("refresh token: Should return access token", async () => {
  // refreshToken after login
  const tokens: any = await authenticateUser({ email, password });
  expect(tokens).toBeInstanceOf(Object);
  // or/and
  expect(tokens).not.toEqual({});
  // call for refresh to get new access token
  const newAccessToken = await verifyRefreshTokenAndGetAccessToken(
    tokens.refreshToken,
  );
  expect(newAccessToken).not.toEqual("");
});

// close redis when all tests are done
afterAll(async () => {
  await redis.quit();
});
