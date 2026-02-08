import { authUserSchema } from "../../src/modules/auth/auth.schema";
import { refreshTokenSchema } from "../../src/modules/token/token.schema";

const correctEmail = "test@email.com";
const correctPassword = "12345";
const invalidEmail = "invalid-email";
const veryLongPassWord = `very-long-password-very-long-password-very-long-password-very-long-password-very-long-password-very-long-password-very-long-password-very-long-password-very-long-password`;
const veryShortPassword = "1";
const spacedPassword = " this is new password ";

const validToken = "valid_token";
const invalidNumberToken = 2232;
const invalidEmptyToken = "";

describe("Input Validation Unit Test for authUserSchema", () => {
  test("should pass - valid data", () => {
    const result = authUserSchema.safeParse({
      email: correctEmail,
      password: correctPassword,
    });
    expect(result.success).toBeTruthy();
  });
  test("shlould fail - empty fields (email, password)", () => {
    const result = authUserSchema.safeParse({});
    expect(result.success).toBeFalsy();
  });
  test("should fail - empty email", () => {
    const result = authUserSchema.safeParse({ password: correctPassword });
    expect(result.success).toBeFalsy();
  });
  test("should fail - empty password", () => {
    const result = authUserSchema.safeParse({ email: correctEmail });
    expect(result.success).toBeFalsy();
  });
  test("should fail - invalid email format", () => {
    const result = authUserSchema.safeParse({
      email: invalidEmail,
      password: correctPassword,
    });
    expect(result.success).toBeFalsy();
  });
  test("should fail - very short password (min should be >= 5)", () => {
    const result = authUserSchema.safeParse({
      email: correctEmail,
      password: veryShortPassword,
    });
    expect(result.success).toBeFalsy();
  });
  test("should fail - very long password (max should be <= 20)", () => {
    const result = authUserSchema.safeParse({
      email: correctEmail,
      password: veryLongPassWord,
    });
    expect(result.success).toBeFalsy();
  });
  test("should pass - passwords with spaces", () => {
    const result = authUserSchema.safeParse({
      email: correctEmail,
      password: spacedPassword,
    });
    expect(result.success).toBeTruthy();
  });
});

describe("Input Validation Unit Test for TokenSchema", () => {
  test("should pass - valid token", () => {
    const result = refreshTokenSchema.safeParse({ refreshToken: validToken });
    expect(result.success).toBeTruthy();
  });
  test("should fail - invalid number token", () => {
    const result = refreshTokenSchema.safeParse({
      refreshToken: invalidNumberToken,
    });
    expect(result.success).toBeFalsy();
  });
  test("should fail - empty token", () => {
    const result = refreshTokenSchema.safeParse({
      refreshToken: invalidEmptyToken,
    });
    expect(result.success).toBeFalsy();
  });
});
