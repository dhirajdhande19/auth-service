import bcrypt from "bcryptjs";
import { JWT_SECRET_REFRESH_TOKEN } from "../../src/config/env";
import { redis } from "../../src/config/redis";
import {
  getJwtAccessToken,
  getJwtRefreshToken,
  revokeAllSessions,
  revokeCurrentSession,
  setRefreshTokenInRedis,
  verifyRefreshTokenAndGetAccessToken,
} from "../../src/modules/token/token.service";
import { UserRole } from "../../src/modules/user/user.types";
import jwt from "jsonwebtoken";

// getJwtAccessToken
describe("getJwtAccessToken", () => {
  let userData: any = {
    id: "123",
    email: "user@email.com",
    role: UserRole.User,
    provider: "local",
  };
  test("should return accessToken - valid user data", () => {
    const result = getJwtAccessToken(userData);
    expect(result).not.toBe("");
    expect(result.length).toBeGreaterThan(0);
  });
  test("should return '' - invalid user role", () => {
    userData = {
      role: "invalidRole",
    };
    const result = getJwtAccessToken(userData);
    expect(result).toBe("");
    expect(result).toHaveLength(0);
  });
  test("should return '' - invalid empty user", () => {
    userData = {
      role: "",
      email: "",
      id: "",
      provider: "",
    };
    const result = getJwtAccessToken(userData);
    expect(result).toBe("");
    expect(result).toHaveLength(0);
  });
});

// getJwtRefreshToken
describe("getJwtRefreshToken", () => {
  let userData: any = {
    id: "123",
    email: "user@email.com",
    role: UserRole.User,
    provider: "local",
  };
  test("should return accessToken - valid user data", () => {
    const result = getJwtRefreshToken(userData);
    expect(result).not.toBe("");
    expect(result.length).toBeGreaterThan(0);
  });
  test("should return '' - invalid user role", () => {
    userData = {
      role: "invalidRole",
    };
    const result = getJwtRefreshToken(userData);
    expect(result).toBe("");
    expect(result).toHaveLength(0);
  });
  test("should return '' - invalid empty user", () => {
    userData = {
      role: "",
      email: "",
      id: "",
      provider: "",
    };
    const result = getJwtRefreshToken(userData);
    expect(result).toBe("");
    expect(result).toHaveLength(0);
  });
});

// setRefreshTokenInRedis
describe("setRefreshTokenInRedis", () => {
  let refreshToken = "validToken";
  let email = "user@email.com";
  test("should set user in redis & return nothing (void) - valid data", async () => {
    const result = await setRefreshTokenInRedis(refreshToken, email);
    expect(result).toBe(undefined);
  });
  test("should return 400 - empty refreshToken or/and email", async () => {
    refreshToken = "";
    email = "";
    const result = await setRefreshTokenInRedis(refreshToken, email);
    expect(result).toBe(400);
    expect(result).not.toBe(undefined);
  });
});

// verifyRefreshTokenAndGetAccessToken
describe("verifyRefreshTokenAndGetAccessToken", () => {
  beforeEach(async () => {
    await redis.flushall();
  });
  let userData: any = {
    id: "1234",
    email: "user@email.com",
    provider: "local",
    password: "1234",
    role: "User",
  };
  let refreshToken = "";
  test("should return 400 - empty refreshToken", async () => {
    const result = await verifyRefreshTokenAndGetAccessToken(refreshToken);
    expect(result).toBe(400);
  });
  test("should return access token", async () => {
    refreshToken = jwt.sign(userData, JWT_SECRET_REFRESH_TOKEN, {
      expiresIn: "1h",
    });
    await redis.set(`refreshToken: ${refreshToken}`, refreshToken);
    const result = await verifyRefreshTokenAndGetAccessToken(refreshToken);
    expect(result).toBeInstanceOf(Object);
    expect(result).not.toEqual({});
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });
  test("should return 403 - malformed token present in redis", async () => {
    await redis.set(`refreshToken: ${"malformedToken"}`, "malformedToken");
    const result = await verifyRefreshTokenAndGetAccessToken("malformedToken");
    expect(result).toBe(403);
  });
  test("should return 404 - valid JWT but missing fields", async () => {
    // creating a token with missing role & provider
    const badToken = jwt.sign(
      { id: "123", email: "bad@email.com" },
      JWT_SECRET_REFRESH_TOKEN,
      { expiresIn: "1h" },
    );
    const result = await verifyRefreshTokenAndGetAccessToken(badToken);
    expect(result).toBe(404);
  });
});

// revokeCurrentSession
describe("revokeCurrentSession", () => {
  beforeEach(async () => {
    await redis.flushall();
  });
  let userData: any = {
    id: "1234",
    email: "user@email.com",
    provider: "local",
    password: "1234",
    role: "User",
  };
  let refreshToken = jwt.sign(userData, JWT_SECRET_REFRESH_TOKEN, {
    expiresIn: "1h",
  });

  test("should return 200 - current session revoked", async () => {
    await redis.set(`refreshToken: ${refreshToken}`, refreshToken);
    const result = await revokeCurrentSession(refreshToken);
    expect(result).toBe(200);
  });
  test("should return 400 - empty refresh token", async () => {
    const result = await revokeCurrentSession("");
    expect(result).toBe(400);
  });
  test("should return 404 - no such user present in redis", async () => {
    userData = {
      id: "1234",
      email: "user@email.com",
      provider: "local",
      password: "1234",
      role: "User",
    };
    refreshToken = jwt.sign(userData, JWT_SECRET_REFRESH_TOKEN, {
      expiresIn: "1h",
    });
    const result = await revokeCurrentSession(refreshToken);
    expect(result).toBe(404);
  });
});

// revokeAllSessions
describe("revokeAllSessions", () => {
  beforeEach(async () => {
    await redis.flushall();
  });
  let userData: any = {
    id: "1234",
    email: "user@email.com",
    provider: "local",
    password: "1234",
    role: "User",
  };
  let refreshToken = jwt.sign(userData, JWT_SECRET_REFRESH_TOKEN, {
    expiresIn: "1h",
  });

  test("should return 200 - all sessions revoked", async () => {
    await redis
      .multi()
      .set(`refreshToken: ${refreshToken}`, refreshToken)
      .sadd(`refreshTokens: ${userData.email}`, "newRefreshToken1")
      .sadd(`refreshTokens: ${userData.email}`, "newRefreshToken2")
      .sadd(`refreshTokens: ${userData.email}`, "newRefreshToken3")
      .sadd(`refreshTokens: ${userData.email}`, "newRefreshToken4")
      .exec();

    const result = await revokeAllSessions(refreshToken);
    expect(result).toBe(200);
  });
  test("should return 400 - empty refresh token", async () => {
    const result = await revokeAllSessions("");
    expect(result).toBe(400);
  });
  test("should return 404 - no such user present in redis", async () => {
    userData = {
      id: "1234",
      email: "user@email.com",
      provider: "local",
      password: "1234",
      role: "User",
    };
    refreshToken = jwt.sign(userData, JWT_SECRET_REFRESH_TOKEN, {
      expiresIn: "1h",
    });
    const result = await revokeAllSessions(refreshToken);
    expect(result).toBe(404);
  });
});
