import { redis } from "../../src/config/redis";
import {
  authenticateUser,
  createUser,
} from "../../src/modules/auth/local/localAuth.service";
import { LocalUser, UserRole } from "../../src/modules/user/user.types";

beforeAll(async () => {
  await redis.flushall(); // clears all keys
});

describe("Local Auth flow", () => {
  const email = "test@gmail.com";
  const password = "12345";

  const ValidUserData: LocalUser = {
    id: "123",
    email: email,
    password: password,
    role: UserRole.User,
    provider: "local",
  };

  test("should return 201 - register user", async () => {
    const result = await createUser(ValidUserData);
    expect(result).toBe(201);
  });
  test("should return 409 - same email (confilct)", async () => {
    const result = await createUser(ValidUserData);
    expect(result).toBe(409); // failure reason: same email
  });

  test("should return 401 - wrong password (login)", async () => {
    const result = await authenticateUser({ email, password: "54321" });
    expect(result).toBe(401);
  });

  test("should return 404 - user don't exist yet (new email - login)", async () => {
    const result = await authenticateUser({
      email: "newUser@email.com",
      password: "54321",
    });
    expect(result).toBe(404);
  });

  test("should return object {accessToken, refreshToken} - login user", async () => {
    const tokens = await authenticateUser(ValidUserData);
    expect(tokens).toBeInstanceOf(Object);
    expect(Object.keys(tokens).length).toBeGreaterThan(0);
    expect(tokens).not.toEqual({});
    expect(tokens).toHaveProperty("accessToken");
    expect(tokens).toHaveProperty("refreshToken");
  });
});
