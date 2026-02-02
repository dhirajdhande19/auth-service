import { Request, Response } from "express";
import { redis } from "../../config/redis";
import { compare, hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  JWT_EXPIRES_IN_ACCESS_TOKEN,
  JWT_EXPIRES_IN_REFRESH_TOKEN,
  JWT_SECRET_ACCESS_TOKEN,
  JWT_SECRET_REFRESH_TOKEN,
  REDIS_EXPIRE_REFRESH_TOKEN,
} from "../../config/env";

export const isHashedPassword = (hashedPassword: string): boolean => {
  const bcryptRegex = /^\$2[aby]?\$\d{1,2}\$[./A-Za-z0-9]{53}$/;
  return bcryptRegex.test(hashedPassword);
};

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body;
  const isPrevUser = await redis.hget(`user: ${email}`, "id");

  if (isPrevUser) {
    res.status(409).json({
      message: `User with given email already exists, try new email!`,
    });
    return;
  }

  const hashedPassword = await hash(password, 10);

  if (!isHashedPassword(hashedPassword)) {
    res.status(500).json({ message: "Failed to hash password!" });
    return;
  }

  const userData = {
    id: crypto.randomUUID(),
    role: "User",
    password: hashedPassword,
    email: email,
  };

  await redis.hset(`user: ${email}`, userData);

  res.status(201).json({ message: "User Registered Successfully!" });
};

export const isValidUserData = (userData: any): boolean => {
  if (
    !userData.id ||
    !userData.email ||
    !userData.password ||
    !userData.role ||
    (userData.role != "Admin" && userData.role != "User")
  )
    return false;
  return true;
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const isPrevUser = await redis.hget(`user: ${email}`, "id");
  const userData = await redis.hgetall(`user: ${email}`);

  if (!isValidUserData(userData)) {
    res.status(500).json({ mesaage: "Corrupted user data in redis!" });
    return;
  }

  if (!isPrevUser) {
    res.status(404).json({
      message: `No user found with given email, Register first!`,
    });
    return;
  }

  const hashedPassword = userData?.password;
  if (!hashedPassword) {
    res.status(500).json({ message: "Could not find password in redis!" });
    return;
  }

  const isPasswordCorrect = await compare(password, hashedPassword);
  if (!isPasswordCorrect) {
    res
      .status(401)
      .json({ message: "Unauthorized!", details: "Incorrect Password" });
    return;
  }

  const accessToken = jwt.sign(
    { id: userData.id, email: email, role: userData.role },
    JWT_SECRET_ACCESS_TOKEN,
    {
      expiresIn: JWT_EXPIRES_IN_ACCESS_TOKEN as jwt.SignOptions["expiresIn"],
    },
  );

  const refreshToken = jwt.sign(
    { id: userData.id, email: email, role: userData.role },
    JWT_SECRET_REFRESH_TOKEN,
    {
      expiresIn: JWT_EXPIRES_IN_REFRESH_TOKEN as jwt.SignOptions["expiresIn"],
    },
  );

  // update refresh token for user
  await redis.set(`refreshToken: ${refreshToken}`, refreshToken);
  // set expiry
  const expireIn = REDIS_EXPIRE_REFRESH_TOKEN
    ? Number(REDIS_EXPIRE_REFRESH_TOKEN) * 24 * 60 * 60
    : 604800; // fallback to 7days in seconds
  await redis.expire(`refreshToken: ${refreshToken}`, expireIn); // days * 24 * 60 * 60 -> xxx Seconds

  res
    .status(201)
    .json({ accessToken: accessToken, refreshToken: refreshToken });
};

// refresh token (token rotation)
export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { refreshToken } = req.body;
  const key = `refreshToken: ${refreshToken}`;

  const isRefreshTokenPresent = await redis.get(key);

  if (!isRefreshTokenPresent) {
    res.status(403).json({
      message: "Unauthorized",
      details: "refreshToken is expired, re-login to create new refreshToken",
    });
    return;
  }

  jwt.verify(refreshToken, JWT_SECRET_REFRESH_TOKEN, (err: any, user: any) => {
    if (!err) {
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET_ACCESS_TOKEN,
        {
          expiresIn:
            JWT_EXPIRES_IN_ACCESS_TOKEN as jwt.SignOptions["expiresIn"],
        },
      );
      res.status(201).json({ accessToken: accessToken });
    } else {
      res
        .status(403)
        .json({ message: "Unauthorized, Login first", details: err?.message });
    }
  });
};

// unit testing functions
// register
export const registerUserTest = async (
  email: string,
  password: string,
): Promise<boolean> => {
  try {
    const isPrevUser = await redis.hget(`user: ${email}`, "id");

    if (isPrevUser) return false;

    const hashedPassword = await hash(password, 10);

    if (!isHashedPassword(hashedPassword)) return false;

    const userData = {
      id: crypto.randomUUID(),
      role: "User",
      password: hashedPassword,
      email: email,
    };

    await redis.hset(`user: ${email}`, userData);
    await redis.expire(`user: ${email}`, 60);
    return true;
  } catch {
    return false;
  }
};

// login
export const loginUserTest = async (
  email: string,
  password: string,
): Promise<Object> => {
  try {
    const isPrevUser = await redis.hget(`user: ${email}`, "id");
    const userData = await redis.hgetall(`user: ${email}`);

    if (!isValidUserData(userData)) return {};

    if (!isPrevUser) return {};

    const hashedPassword = userData?.password;
    if (!hashedPassword) return {};

    const isPasswordCorrect = await compare(password, hashedPassword);
    if (!isPasswordCorrect) return {};

    const accessToken = jwt.sign(
      { id: userData.id, email: email, role: userData.role },
      JWT_SECRET_ACCESS_TOKEN,
      {
        expiresIn: JWT_EXPIRES_IN_ACCESS_TOKEN as jwt.SignOptions["expiresIn"],
      },
    );

    const refreshToken = jwt.sign(
      { id: userData.id, email: email, role: userData.role },
      JWT_SECRET_REFRESH_TOKEN,
      {
        expiresIn: JWT_EXPIRES_IN_REFRESH_TOKEN as jwt.SignOptions["expiresIn"],
      },
    );

    // update refresh token for user
    await redis.set(`refreshToken: ${refreshToken}`, refreshToken);
    // set expiry
    await redis.expire(`refreshToken: ${refreshToken}`, 60 * 2); //  2 * 60 -> 2mins

    return { accessToken: accessToken, refreshToken: refreshToken };
  } catch {
    return {};
  }
};

// refresh token
export const refreshTokenTest = async (
  refreshToken: string,
): Promise<string> => {
  try {
    const key = `refreshToken: ${refreshToken}`;

    const isRefreshTokenPresent = await redis.get(key);

    if (!isRefreshTokenPresent) {
      return "";
    }

    const user: any = jwt.verify(refreshToken, JWT_SECRET_REFRESH_TOKEN);
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET_ACCESS_TOKEN,
      {
        expiresIn: JWT_EXPIRES_IN_ACCESS_TOKEN as jwt.SignOptions["expiresIn"],
      },
    );

    return accessToken;
  } catch {
    return "";
  }
};
