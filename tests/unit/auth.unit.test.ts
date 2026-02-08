import { redis } from "../../src/config/redis";
import jwt from "jsonwebtoken";
import { authUserSchema } from "../../src/modules/auth/auth.schema";
import { isHashedPassword, isValidUserData } from "../../src/utils/helper";
import { JWT_SECRET_REFRESH_TOKEN } from "../../src/config/env";
import {
  AuthProvider,
  LocalUser,
  UserData,
  UserRole,
} from "../../src/modules/user/user.types";

import {
  authenticateUser,
  createUser,
} from "../../src/modules/auth/local/localAuth.service";
import { verifyRefreshTokenAndGetAccessToken } from "../../src/modules/token/token.service";

const correctEmail = "test@email.com";
const correctPassword = "12345";

const wrongEmail = "wrong@email.com";
const wrongPassword = "54321";

const validUser: UserData = {
  id: crypto.randomUUID(),
  email: "validUser@gmail.com",
  password: "userPassword",
  role: UserRole.User,
  provider: "local",
};

const emptyInvalidUser: UserData = {
  id: "",
  email: "",
  password: "",
  role: UserRole.User,
  provider: "local",
};
const invalidUserOAuthUser: UserData = {
  id: "",
  email: "",
  role: UserRole.User,
  provider: AuthProvider.Google,
};

const tamperedRefreshToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTUxNjIzOTAyMn0.niN3IGB58FoJwPdxqsqKz9GpzTxd1MtyF7t7y49avRE";

const invalidRefreshToken = "invalid Refresh Token";

beforeAll(async () => {
  await redis.flushall(); // clears all keys
});

// register user
describe("Register Unit Test", () => {
  const userData: LocalUser = {
    email: correctEmail,
    password: correctPassword,
    role: UserRole.User,
    id: crypto.randomUUID(),
    provider: "local",
  };
  test("registration success - should return 201", async () => {
    const isRegisterSuccess = await createUser(userData);
    expect(isRegisterSuccess).toBe(201);
  });
  test("registration fail - should return 409 - duplicate email", async () => {
    const isRegisterFailure = await createUser(userData);
    expect(isRegisterFailure).toBe(409);
  });
});

// login user
describe("Login Unit Test", () => {
  test(`should return {'accessToken', 'refreshToken'}`, async () => {
    const validUser: UserData = {
      id: crypto.randomUUID(),
      email: "new@gmail.com",
      password: "userPassword",
      role: UserRole.User,
      provider: "local",
    };

    const result = await createUser(validUser);
    expect(result).toBe(201);
    const tokens = await authenticateUser(validUser);
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
    const result = await authenticateUser({
      email: wrongEmail,
      password: correctPassword,
    });
    expect(result).toBe(404);
  });
  test("should return 401 - correct email & wrong password", async () => {
    const result = await authenticateUser({
      email: correctEmail,
      password: wrongPassword,
    });
    expect(result).toBe(401);
  });
});

// corrupted user checks
describe("Corrupted User Unit Test", () => {
  test("should not be corrupted user_data", () => {
    const isUserCorrupted = isValidUserData(validUser);
    expect(isUserCorrupted).toBeTruthy();
  });
  test("should be corrupted user_data - Invalid local user", () => {
    const isUserCorrupted = isValidUserData(emptyInvalidUser);
    expect(isUserCorrupted).toBeFalsy();
  });
  test("should be corrupted user_data - Invalid OAuth user", () => {
    const isUserCorrupted = isValidUserData(invalidUserOAuthUser);
    expect(isUserCorrupted).toBeFalsy();
  });
});

describe("Refresh Token Unit Test", () => {
  test("should pass - get refresh & access token via login and then ask for access token", async () => {
    const tokens: any = await authenticateUser({
      email: correctEmail,
      password: correctPassword,
    });
    expect(tokens).toBeInstanceOf(Object);
    // and/or
    expect(tokens).not.toEqual({}); // should not be empty obj
    // and/or
    expect(Object.keys(tokens).length).toBeGreaterThan(0);
    // and/or
    expect(tokens).toHaveProperty("accessToken");
    expect(tokens).toHaveProperty("refreshToken");

    const refreshToken = tokens.refreshToken;
    const newAccessToken =
      await verifyRefreshTokenAndGetAccessToken(refreshToken);
    expect(newAccessToken).toBeInstanceOf(Object);
    expect(newAccessToken).not.toEqual({});
    expect(Object.keys(newAccessToken).length).toBeGreaterThan(0);
  });
  test("should return 400 - empty refresh token", async () => {
    const result = await verifyRefreshTokenAndGetAccessToken("");
    expect(result).toBe(400);
  });
  test("should return 403 - tampered token but present in redis", async () => {
    await redis.set(
      `refreshToken: ${tamperedRefreshToken}`,
      tamperedRefreshToken,
    );
    const result =
      await verifyRefreshTokenAndGetAccessToken(tamperedRefreshToken);
    expect(result).toBe(403);
  });
  test("should return 403 - malformed token present in redis", async () => {
    await redis.set(
      `refreshToken: ${invalidRefreshToken}`,
      invalidRefreshToken,
    );
    const result =
      await verifyRefreshTokenAndGetAccessToken(invalidRefreshToken);
    expect(result).toBe(403);
  });
  test("should return 404 - valid JWT but missing fields", async () => {
    // creating a token with missing role
    const badToken = jwt.sign(
      { id: "123", email: "bad@email.com" },
      JWT_SECRET_REFRESH_TOKEN,
      { expiresIn: "1h" },
    );
    const result = await verifyRefreshTokenAndGetAccessToken(badToken);
    expect(result).toBe(404);
  });
});

// close redis when all tests are done
afterAll(async () => {
  await redis.quit();
});
