import { JWT_SECRET_REFRESH_TOKEN } from "../../src/config/env";
import { redis } from "../../src/config/redis";
import {
  authenticateUser,
  createUser,
} from "../../src/modules/auth/local/localAuth.service";
import {
  revokeCurrentSession,
  verifyRefreshTokenAndGetAccessToken,
} from "../../src/modules/token/token.service";
import { LocalUser, UserRole } from "../../src/modules/user/user.types";
import jwt from "jsonwebtoken";

beforeAll(async () => {
  await redis.flushall();
});

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe("verifyRefreshTokenAndGetAccessToken flow", () => {
  const userData: LocalUser = {
    id: "123",
    email: "user@email.com",
    password: "12345",
    role: UserRole.User,
    provider: "local",
  };

  test("should return 201 - register user", async () => {
    const result = await createUser(userData);
    expect(result).toBe(201);
  });
  test("should return access token - verifyRefreshTokenAndGetAccessToken", async () => {
    const tokens: any = await authenticateUser({
      email: userData.email,
      password: userData.password,
    });
    expect(tokens).toBeInstanceOf(Object);
    expect(tokens).not.toEqual({});
    const newAccessToken = await verifyRefreshTokenAndGetAccessToken(
      tokens.refreshToken,
    );
    expect(newAccessToken).not.toEqual("");
  });
  test("should return 400 - empty refreshToken", async () => {
    const result = await verifyRefreshTokenAndGetAccessToken("");
    expect(result).not.toBeInstanceOf(Object);
    expect(result).toBe(400);
  });
  test("should return 404 - invalid refreshToken", async () => {
    const refreshToken = mockedJwt.sign(userData, JWT_SECRET_REFRESH_TOKEN, {
      expiresIn: "1h",
    });
    // user/token is not set in redis; hence user don't exits to us -> invalid refreshToken even tho it's secret is valid
    const result = await verifyRefreshTokenAndGetAccessToken(refreshToken);
    expect(result).not.toBeInstanceOf(Object);
    expect(result).toBe(404);
  });
  test("should return 403 - expired refresh token in redis", async () => {
    const refreshToken = mockedJwt.sign(userData, JWT_SECRET_REFRESH_TOKEN, {
      expiresIn: "1ms",
    });
    await redis.set(`refreshToken: ${refreshToken}`, refreshToken);
    const result = await verifyRefreshTokenAndGetAccessToken(refreshToken);
    expect(result).toBe(403);
  });
  test("should return 404 - trying to use refreshToken after it`s been revoked", async () => {
    const refreshToken = mockedJwt.sign(userData, JWT_SECRET_REFRESH_TOKEN, {
      expiresIn: "1h",
    });
    await redis.set(`refreshToken: ${refreshToken}`, refreshToken);
    const revokedStatus = await revokeCurrentSession(refreshToken);
    expect(revokedStatus).toBe(200); // revoked current session
    // trying to get access token after curr session have been revoked
    const result = await verifyRefreshTokenAndGetAccessToken(refreshToken);
    expect(result).toBe(404);
    expect(result).not.toBeInstanceOf(Object);
  });
});
