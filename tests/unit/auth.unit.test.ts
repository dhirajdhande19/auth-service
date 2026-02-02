import { redis } from "../../src/config/redis";
import {
  isHashedPassword,
  isValidUserData,
  loginUserTest,
  refreshTokenTest,
  registerUserTest,
} from "../../src/modules/auth/auth.controller";

import { authUserSchema } from "../../src/modules/auth/auth.schema";

const correctEmail = "test@email.com";
const correctPassword = "12345";

const wrongEmail = "wrong@email.com";
const wrongPassword = "54321";

const invalidEmail = "invalid-email";
const veryLongPassWord = `very-long-password-very-long-password-very-long-password-very-long-password-very-long-password-very-long-password-very-long-password-very-long-password-very-long-password`;
const veryShortPassword = "1";
const spacedPassword = " this is new password ";

const validHashedPassword =
  "$2b$10$iGg/9uZhbLVhl.BkFnfNoO0OGnLuweX.URICnzXIePPz5uCFrj7uu";
const invalidHashedPassword = "Wrong_Hashed_Password";

const validUser = {
  id: "id_123",
  email: "validUser@gmail.com",
  password: "userPassword",
  role: "User",
};
const invalidRoleUser = {
  id: "id_124",
  email: "validUser2@gmail.com",
  role: "Author",
};
const emptyInvalidUser = {};
const invalidUser = {
  id: "125",
};

const tamperedRefreshToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTUxNjIzOTAyMn0.niN3IGB58FoJwPdxqsqKz9GpzTxd1MtyF7t7y49avRE";

const invalidRefreshToken = "invalid Refresh Token";

beforeAll(async () => {
  await redis.flushall(); // clears all keys
});

// cases like {valid-email, empty-fields, short_null_veryLong-password...} are handled by zod-validation
describe("Input Validation Unit Test for Register & Login", () => {
  test("validation success", () => {
    const result = authUserSchema.safeParse({
      email: correctEmail,
      password: correctPassword,
    });
    expect(result.success).toBeTruthy();
  });
  test("validation fail - empty fields (email, password)", () => {
    const result = authUserSchema.safeParse({});
    expect(result.success).toBeFalsy();
  });
  test("validation fail - empty email", () => {
    const result = authUserSchema.safeParse({ password: correctPassword });
    expect(result.success).toBeFalsy();
  });
  test("validation fail - empty password", () => {
    const result = authUserSchema.safeParse({ email: correctEmail });
    expect(result.success).toBeFalsy();
  });
  test("validation fail - invalid email format", () => {
    const result = authUserSchema.safeParse({
      email: invalidEmail,
      password: correctPassword,
    });
    expect(result.success).toBeFalsy();
  });
  test("validation fail - very short password (min should be >= 5)", () => {
    const result = authUserSchema.safeParse({
      email: correctEmail,
      password: veryShortPassword,
    });
    expect(result.success).toBeFalsy();
  });
  test("validation fail - very long password (max should be <= 20)", () => {
    const result = authUserSchema.safeParse({
      email: correctEmail,
      password: veryLongPassWord,
    });
    expect(result.success).toBeFalsy();
  });
  test("validation success - should pass passwords with spaces", () => {
    const result = authUserSchema.safeParse({
      email: correctEmail,
      password: spacedPassword,
    });
    expect(result.success).toBeTruthy();
  });
});

// register user
describe("Register Unit Test", () => {
  test("registration success", async () => {
    const isRegisterSuccess = await registerUserTest(
      correctEmail,
      correctPassword,
    );
    expect(isRegisterSuccess).toBeTruthy();
  });
  test("registration fail - duplicate email", async () => {
    const isRegisterFailure = await registerUserTest(
      correctEmail,
      wrongPassword,
    );
    expect(isRegisterFailure).toBeFalsy();
  });
});

// password hashing test
describe("Password Hashing Unit Test", () => {
  test("password hashing success - valid hashed password", () => {
    const result = isHashedPassword(validHashedPassword);
    expect(result).toBeTruthy();
  });
  test("password hashing fail - invalid hashed password", () => {
    const result = isHashedPassword(invalidHashedPassword);
    expect(result).toBeFalsy();
  });
  test("password hashing fail - empty hashedPassword", () => {
    const result = isHashedPassword("");
    expect(result).toBeFalsy();
  });
});

// login user
describe("Login Unit Test", () => {
  test(`should return {'accessToken', 'refreshToken'}`, async () => {
    const tokens = await loginUserTest(correctEmail, correctPassword);
    expect(tokens).toBeInstanceOf(Object);
    // and/or
    expect(tokens).not.toEqual({}); // should not be empty obj
    // and/or
    expect(Object.keys(tokens).length).toBeGreaterThan(0);
    // and/or
    expect(tokens).toHaveProperty("accessToken");
    expect(tokens).toHaveProperty("refreshToken");
  });
  test(`should fail - wrong email & correct password`, async () => {
    const isObjEmpty = await loginUserTest(wrongEmail, correctPassword);
    expect(isObjEmpty).toEqual({});
  });
  test("should fail - correct email & wrong password", async () => {
    const isObjEmpty = await loginUserTest(correctEmail, wrongPassword);
    expect(isObjEmpty).toEqual({});
  });
});

// corrupted user checks
describe("Corrupted User Unit Test", () => {
  test("should not be corrupted user_data", () => {
    const isUserCorrupted = isValidUserData(validUser);
    expect(isUserCorrupted).toBeTruthy();
  });
  test("should be corrupted user_data - empty user data", () => {
    const isUserCorrupted = isValidUserData(emptyInvalidUser);
    expect(isUserCorrupted).toBeFalsy();
  });
  test("should be corrupted user_data - only 1 valid field out of 3", () => {
    const isUserCorrupted = isValidUserData(invalidUser);
    expect(isUserCorrupted).toBeFalsy();
  });
  test("should be corrupted user_data - mismatched role", () => {
    const isUserCorrupted = isValidUserData(invalidRoleUser);
    expect(isUserCorrupted).toBeFalsy();
  });
});

describe("Refresh Token Unit Test", () => {
  test("should pass - get refresh & access token via login and then ask for access token", async () => {
    const tokens: any = await loginUserTest(correctEmail, correctPassword);
    expect(tokens).toBeInstanceOf(Object);
    expect(Object.keys(tokens).length).toBeGreaterThan(0);
    const refreshToken = tokens.refreshToken;
    const newAccessToken = await refreshTokenTest(refreshToken);
    expect(newAccessToken.length).toBeGreaterThan(0);
    expect(newAccessToken).not.toEqual("");
  });
  test("should fail - empty refresh token", async () => {
    const result = await refreshTokenTest("");
    expect(result.length).toBe(0);
    expect(result).toBeFalsy();
  });
  test("should fail - tampered Refresh Token", async () => {
    const result = await refreshTokenTest(tamperedRefreshToken);
    expect(result.length).toBe(0);
    expect(result).toBeFalsy();
  });
  test("should fail - invalid refresh token", async () => {
    const result = await refreshTokenTest(invalidRefreshToken);
    expect(result.length).toBe(0);
    expect(result).toBeFalsy();
  });
});

// close redis when all tests are done
afterAll(async () => {
  await redis.quit();
});
