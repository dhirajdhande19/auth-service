import jwt from "jsonwebtoken";
import { authMiddleware } from "../../src/middlewares/auth.middleware";
import { adminRoleMiddleware } from "../../src/middlewares/adminRole.Middleware";
import { rateLimit } from "../../src/middlewares/rateLimit.middleware";
import { validate } from "../../src/middlewares/validate.middleware";
import { redis } from "../../src/config/redis";
import z, { json } from "zod";

jest.mock("jsonwebtoken");
jest.mock("../../src/config/redis", () => ({
  redis: {
    incr: jest.fn(),
    expire: jest.fn(),
    get: jest.fn(),
  },
}));

let req: any;
let res: any;
let next = jest.mock;

// Auth Middleware
describe("authMiddleware", () => {
  beforeEach(() => {
    req = {
      header: {},
      originalUrl: "/test-route",
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  test("should return 401 if no token provided", async () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 401 if jwt.verify throw", () => {
    req.headers = {
      authorization: "Bearer invalidToken",
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("jwt expired");
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid Token",
      details: "jwt expired",
    });
    expect(next).not.toHaveBeenCalled();
  });
  test("should return 401 if jwt.verify returns falsy", () => {
    req.headers = {
      authorization: "Bearer someToken",
    };
    (jwt.verify as jest.Mock).mockReturnValue(null);

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  test("should call next and atttach user if token is valid", () => {
    req.headers = {
      authorization: "Bearer validToken",
    };
    const decodedUser = {
      email: "test@email.com",
      role: "User",
      id: "12345",
    };
    (jwt.verify as jest.Mock).mockReturnValue(decodedUser);
    authMiddleware(req, res, next);

    expect(req.user).toEqual(decodedUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// Admin role middleware
describe("adminRoleMiddleware", () => {
  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  test("should return 401 empty user role", () => {
    req = {
      user: {
        role: "",
      },
    };

    adminRoleMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid User Role" });
    expect(next).not.toHaveBeenCalled();
  });
  test("should return 401 invalid user role", () => {
    req = {
      user: {
        role: "invalidUserRole",
      },
    };

    adminRoleMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid User Role" });
    expect(next).not.toHaveBeenCalled();
  });
  test("should return 401 & Unauthorized (No one can access this route except Admin)", () => {
    req = {
      user: {
        role: "User",
      },
    };

    adminRoleMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      details: `Only Admins have access to this route and ur role is ${req.user.role}`,
    });
    expect(next).not.toHaveBeenCalled();
  });
  test("should grant access and call next", () => {
    req = {
      user: {
        role: "Admin",
      },
    };

    adminRoleMiddleware(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});

// rateLimit
describe("rateLimit", () => {
  beforeEach(() => {
    req = {
      originalUrl: "/test",
      baseUrl: "/test",
      ip: "123",
    } as any;

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  test("should fail - too many requests", async () => {
    // redis already over limit
    (redis.incr as jest.Mock).mockResolvedValue(1000);
    (redis.get as jest.Mock).mockResolvedValue(0);

    await rateLimit(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: "Too Many Request!",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should pass and allow reques if under limit", async () => {
    (redis.incr as jest.Mock).mockResolvedValue(1);
    (redis.get as jest.Mock).mockResolvedValue(0);

    await rateLimit(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// validate middleware
describe("validate", () => {
  const testSchema = z
    .object({
      name: z.string(),
    })
    .required();
  beforeEach(() => {
    req = {
      originalUrl: "/test",
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  test("should return 400 if validation fails", () => {
    req.body = { name: 123 }; // invalid
    const middleware = validate(testSchema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("should call next and attach parsed body if valid", () => {
    req.body = { name: "Dhiraj" };
    const middleware = validate(testSchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body).toEqual({ name: "Dhiraj" });
  });

  test("should call next if unexpected error occurs", () => {
    const badSchema = {
      safeParse: () => {
        throw new Error("unexpected");
      },
    } as any;

    const middleware = validate(badSchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
