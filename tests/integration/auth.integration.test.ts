// unit testing for auth

import { redis } from "../../src/config/redis";
import {
  registerUserTest,
  loginUserTest,
  refreshTokenTest,
} from "../../src/modules/auth/auth.controller";

const email = "test@gmail.com";
const password = "12345";

beforeAll(async () => {
  await redis.flushall(); // clears all keys
});

test("register user: Should return true", async () => {
  const isRegisterSuccess = await registerUserTest(email, password);
  expect(isRegisterSuccess).toBeTruthy(); // true
});

test("register user: Should return false", async () => {
  const isRegisterFailure = await registerUserTest(email, password);
  expect(isRegisterFailure).toBeFalsy(); // failure reason: same email
});

test("login user: Should return object (accessToken, refreshToken)", async () => {
  // login
  const tokens = await loginUserTest(email, password);
  expect(tokens).toBeInstanceOf(Object);
  // or/and
  expect(Object.keys(tokens).length).toBeGreaterThan(0);
  // or/and
  expect(tokens).not.toEqual({});
});

test("login user: Should return null ( {} )", async () => {
  const NullToken = await loginUserTest(email, "54321");
  expect(Object.keys(NullToken)).toHaveLength(0); // failure reason: wrong password (reaturn {})
  // or / and
  expect(NullToken).toEqual({});
});

test("refresh token: Should return access token", async () => {
  // refreshToken after login
  const tokens: any = await loginUserTest(email, password);
  expect(tokens).toBeInstanceOf(Object);
  // or/and
  expect(tokens).not.toEqual({});
  // call for refresh to get new access token
  const newAccessToken = await refreshTokenTest(tokens.refreshToken);
  // console.log(newAccessToken);
  expect(newAccessToken.length).toBeGreaterThan(0);
  // or/and
  expect(newAccessToken).not.toEqual("");
});

// close redis when all tests are done
afterAll(async () => {
  await redis.quit();
});
