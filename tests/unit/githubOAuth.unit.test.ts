import axios from "axios";
import {
  getGithubAccessToken,
  getUserEmailFromGithub,
  registerGithubOAuthUser,
} from "../../src/modules/auth/OAuth/githubOAuth.service";
import { redis } from "../../src/config/redis";
import { AuthProvider } from "../../src/modules/user/user.types";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// getGithubAccessToken
describe("getGithubAccessToken", () => {
  let code = "code";
  let codeVerifier = "SHA256";
  test("should return 400 - empty data received", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: null });
    const result = await getGithubAccessToken(code, codeVerifier);
    expect(typeof result).toBe("number");
    expect(result).toBe(400);
  });
  test("should return 400 - no/empty access_token present in data", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "" } });
    const result = await getGithubAccessToken(code, codeVerifier);
    expect(typeof result).toBe("number");
    expect(result).toBe(400);
  });
  test("should return 500 - axios threw error", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));
    const result = await getGithubAccessToken(code, codeVerifier);
    expect(typeof result).toBe("number");
    expect(result).toBe(500);
  });
  test("should return access_token", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "valid_access_token" },
    });
    const result = await getGithubAccessToken(code, codeVerifier);
    expect(typeof result).not.toBe("number");
    expect(typeof result).toBe("string");
    expect(String(result).length).toBeGreaterThan(0);
    expect(result).toEqual("valid_access_token");
  });
});

// getUserEmailFromGithub
describe("getUserEmailFromGithub", () => {
  let accessToken = "access_token";
  test("should return 400 - empty accessToken", async () => {
    const result = await getUserEmailFromGithub("");
    expect(typeof result).toBe("number");
    expect(result).toBe(400);
  });
  test("should return 500 - no data in response", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: null });
    const result = await getUserEmailFromGithub(accessToken);
    expect(typeof result).toBe("number");
    expect(result).toBe(500);
  });
  test("should return 500 - no/empty email in res.data", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { email: "" } });
    const result = await getUserEmailFromGithub(accessToken);
    expect(typeof result).toBe("number");
    expect(result).toBe(500);
  });
  test("should return 500 - axios threw error", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));
    const result = await getUserEmailFromGithub(accessToken);
    expect(typeof result).toBe("number");
    expect(result).toBe(500);
  });
  test("should return email", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { email: "user@email.com" },
    });
    const result = await getUserEmailFromGithub(accessToken);
    console.log(result);
    expect(typeof result).toBe("string");
    expect(String(result).length).toBeGreaterThan(0);
    expect(result).toBe("user@email.com");
  });
});

// registerGithubOAuthUser
describe("registerGithubOAuthUser", () => {
  test("should return 400 - empty & invalid email", async () => {
    const result1 = await registerGithubOAuthUser("");
    const result2 = await registerGithubOAuthUser("@user.com");
    expect(result1).toBe(400);
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
    const result = await registerGithubOAuthUser(user.email);
    expect(typeof result).toBe("number");
    expect(result).toBe(409);
  });
  test("should return 400 - corrupted user data in redis (password present for OAuth user)", async () => {
    const user = {
      email: "user@email.com",
      id: "123",
      provider: AuthProvider.GitHub,
      password: "12345",
    };
    await redis.hset(`user: ${user.email}`, user);
    const result = await registerGithubOAuthUser(user.email);
    expect(typeof result).toBe("number");
    expect(result).toBe(400);
  });
});
