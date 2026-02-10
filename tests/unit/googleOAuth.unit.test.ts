import {
  googleAuth,
  registerGoogleOAuthUser,
} from "../../src/modules/auth/OAuth/googleOAuth.service";
import axios from "axios";
import jwt from "jsonwebtoken";
import { redis } from "../../src/config/redis";
import { AuthProvider } from "../../src/modules/user/user.types";

jest.mock("jsonwebtoken");
jest.mock("axios");

// googleAuth
describe("googleAuth", () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockedJwt = jwt as jest.Mocked<typeof jwt>;

  test("should return 404 - empty code", async () => {
    const result = await googleAuth("");
    expect(typeof result).toBe("number");
    expect(result).toBe(404);
  });
  test("should return 500 - when axios throws error", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));
    const result = await googleAuth("badCode");
    expect(typeof result).toBe("number");
    expect(result).toBe(500);
  });
  test("should return 500 - when response has no data", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: null });
    const result = await googleAuth("code");
    expect(typeof result).toBe("number");
    expect(result).toBe(500);
  });
  test("should return 500 - when id_token is missing/empty in data", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id_token: {},
      },
    });
    const result = await googleAuth("code");
    expect(typeof result).toBe("number");
    expect(result).toBe(500);
  });
  test("should return valid user when everything is valid", async () => {
    const fakeUser = { sub: "123", email: "user@email.com" };
    mockedAxios.post.mockResolvedValueOnce({ data: { id_token: "token" } });
    mockedJwt.decode.mockReturnValue(fakeUser);
    const result = await googleAuth("validCode");
    expect(result).toEqual(fakeUser);
    expect(typeof result).not.toBe("number");
  });
});

// registerGoogleOAuthUser
describe("registerGoogleOAuthUser", () => {
  beforeEach(async () => {
    await redis.flushall();
  });
  test("should return 400 - empty email & invaid email", async () => {
    const result1 = await registerGoogleOAuthUser("");
    expect(typeof result1).toBe("number");
    expect(result1).toBe(400);
    const result2 = await registerGoogleOAuthUser("@user.com");
    expect(typeof result2).toBe("number");
    expect(result2).toBe(400);
  });
  test("should return 409 - local user with same email already exits", async () => {
    const user = {
      email: "user@email.com",
      id: "123",
      provider: "local",
      password: "12345",
    };
    await redis.hset(`user: ${user.email}`, user);
    const result = await registerGoogleOAuthUser(user.email);
    expect(typeof result).toBe("number");
    expect(result).toBe(409);
  });
  test("should return 400 - corrupted user data in redis (password present for OAuth user)", async () => {
    const user = {
      email: "user@email.com",
      id: "123",
      provider: AuthProvider.Google,
      password: "12345",
    };
    await redis.hset(`user: ${user.email}`, user);
    const result = await registerGoogleOAuthUser(user.email);
    expect(typeof result).toBe("number");
    expect(result).toBe(400);
  });
});

afterAll(async () => await redis.quit());
