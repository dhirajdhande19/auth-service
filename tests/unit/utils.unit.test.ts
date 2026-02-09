import {
  UserData,
  UserRole,
  AuthProvider,
  ValidAuthUserData,
} from "../../src/modules/user/user.types";
import {
  isHashedPassword,
  isUserRole,
  isValidAuthUser,
  isValidEmail,
  isValidProvider,
  isValidUserData,
} from "../../src/utils/helper";

const validHashedPassword =
  "$2b$10$iGg/9uZhbLVhl.BkFnfNoO0OGnLuweX.URICnzXIePPz5uCFrj7uu";
const invalidHashedPassword = "Wrong_Hashed_Password";

// password hashing test (isHashedPassword)
describe("Password Hashing Unit Test", () => {
  test("should pass - valid hashed password", () => {
    const result = isHashedPassword(validHashedPassword);
    expect(result).toBeTruthy();
  });
  test("should fail - invalid hashed password", () => {
    const result = isHashedPassword(invalidHashedPassword);
    expect(result).toBeFalsy();
  });
  test("should fail - empty hashedPassword", () => {
    const result = isHashedPassword("");
    expect(result).toBeFalsy();
  });
});

const validUserData: UserData = {
  email: "user@email.com",
  id: crypto.randomUUID(),
  password: "12345",
  provider: "local",
  role: UserRole.User,
};
const invalidUserData = {
  email: "user@gmail.com",
  id: crypto.randomUUID(),
  password: "12345",
  provider: AuthProvider.GitHub,
  role: UserRole.User,
};

const invalidEmptyUserData = {
  email: "",
  id: "",
  provider: AuthProvider.Google,
  role: UserRole.User,
};

// valid user data test (isValidUserData)
describe("Valid User Unit Test", () => {
  test("should pass - valid user data", () => {
    const result = isValidUserData(validUserData);
    expect(result).toBeTruthy();
  });
  test("should fail - password present for oauth user", () => {
    const result = isValidUserData(invalidUserData);
    expect(result).toBeFalsy();
  });
  test("should fail - empty data", () => {
    const result = isValidUserData(invalidEmptyUserData);
    expect(result).toBeFalsy();
  });
});

// is valid user role (isUserRole)
describe("Valid User Role Unit Test", () => {
  test("should pass - valid user role", () => {
    const result1 = isUserRole("User");
    const result2 = isUserRole("Admin");
    expect(result1).toBeTruthy();
    expect(result2).toBeTruthy();
  });
  test("should fail - empty role", () => {
    const result = isUserRole("");
    expect(result).toBeFalsy();
  });
  test("should fail - invalid (fake) user role", () => {
    const result = isUserRole("FakeUserRole");
    expect(result).toBeFalsy();
  });
});

// is valid proivder (isValidProvider)
describe("Valid Provider Unit Test", () => {
  test("should pass - valid provider", () => {
    const result1 = isValidProvider("local");
    const result2 = isValidProvider(AuthProvider.GitHub);
    const result3 = isValidProvider(AuthProvider.Google);
    expect(result1).toBeTruthy();
    expect(result2).toBeTruthy();
    expect(result3).toBeTruthy();
  });
  test("should fail - empty provider", () => {
    const result = isValidProvider("");
    expect(result).toBeFalsy();
  });
  test("should fail - invalid provider", () => {
    const result = isValidProvider("invalidProvider");
    expect(result).toBeFalsy();
  });
});

const validOAuthUser: ValidAuthUserData = {
  provider: AuthProvider.GitHub,
  id: crypto.randomUUID(),
  role: UserRole.Admin,
  email: "user@gmail.com",
};

const invalidProviderOAuthUser: any = {
  provider: "invalidProvider",
  id: crypto.randomUUID(),
  role: UserRole.Admin,
  email: "user@gmail.com",
};

const invalidRoleOAuthUser: any = {
  provider: AuthProvider.GitHub,
  id: crypto.randomUUID(),
  role: "invalidRole",
  email: "user@gmail.com",
};

const invalidEmptyOAuthUser: any = {
  provider: "",
  id: "",
  role: "",
  email: "",
};

// is valid user data to create token (isValidAuthUser)
describe("Valid user data to create token", () => {
  test("should pass - valid oauth user", () => {
    const result = isValidAuthUser(validOAuthUser);
    expect(result).toBeTruthy();
  });
  test("should fail - invalid provider", () => {
    const result = isValidAuthUser(invalidProviderOAuthUser);
    expect(result).toBeFalsy();
  });
  test("should fail - invalid role", () => {
    const result = isValidUserData(invalidRoleOAuthUser);
    expect(result).toBeFalsy();
  });
  test("should fail - empty user", () => {
    const result = isValidAuthUser(invalidEmptyOAuthUser);
    expect(result).toBeFalsy();
  });
});

// isValidEmail
describe("Is valid email format", () => {
  let email = "user@gmail.com";
  test("should return true - valid email format", () => {
    const result = isValidEmail(email);
    expect(result).toBeTruthy();
  });
  test("should return false - invalid email format", () => {
    email = "user.com";
    const result = isValidEmail(email);
    expect(result).toBeFalsy();
  });
  test("should return false - empty email", () => {
    email = "";
    const result = isValidEmail(email);
    expect(result).toBeFalsy();
  });
});
