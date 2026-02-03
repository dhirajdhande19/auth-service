import { redis } from "../../config/redis";
import {
  AccessToken,
  AuthUserInput,
  TokenInput,
  TokensAfterLogin,
  UserData,
} from "../user/user.types";
import { isHashedPassword, isValidUserData } from "../../utils/helper";
import { compare, hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  JWT_EXPIRES_IN_ACCESS_TOKEN,
  JWT_EXPIRES_IN_REFRESH_TOKEN,
  JWT_SECRET_ACCESS_TOKEN,
  JWT_SECRET_REFRESH_TOKEN,
  REDIS_EXPIRE_REFRESH_TOKEN,
} from "../../config/env";

export const createUser = async (user: AuthUserInput): Promise<number> => {
  const email = user.email;
  const password = user.password;
  // unauthorized
  if (!password) return 401;

  const isPrevUser = await redis.hget(`user: ${email}`, "id");
  if (isPrevUser) return 409; // conflict

  const hashedPassword = await hash(password, 10);
  if (!isHashedPassword(hashedPassword)) return 500; // server err

  const userData: UserData = {
    id: crypto.randomUUID(),
    role: "User",
    password: hashedPassword,
    email: email,
  };

  await redis.hset(`user: ${email}`, userData);

  // user created successfully
  return 201;
};

export const authenticateUser = async (
  user: AuthUserInput,
): Promise<number | TokensAfterLogin> => {
  const email = user.email;
  const password = user.password;

  // unauthorized
  if (!password) return 401;

  const isPrevUser = await redis.hget(`user: ${email}`, "id");
  const userData = await redis.hgetall(`user: ${email}`);

  if (!isPrevUser || Object.keys(userData).length === 0) return 404;

  if (!isValidUserData(userData)) return 404;

  const hashedPassword = userData?.password;
  if (!hashedPassword) return 500;

  const isPasswordCorrect = await compare(password, hashedPassword);
  if (!isPasswordCorrect) return 401;

  const tokenInput: UserData = {
    email: userData.email,
    id: userData.id,
    role: userData.role == "User" ? "User" : "Admin",
  };

  const accessToken = getJwtAccessToken(tokenInput);

  const refreshToken = getJwtRefreshToken(tokenInput);

  await setRefreshTokenInRedis(refreshToken);

  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
};

export const getJwtAccessToken = (userData: TokenInput): string => {
  const accessToken = jwt.sign(
    { id: userData.id, email: userData.email, role: userData.role },
    JWT_SECRET_ACCESS_TOKEN,
    {
      expiresIn: JWT_EXPIRES_IN_ACCESS_TOKEN as jwt.SignOptions["expiresIn"],
    },
  );

  return accessToken;
};

export const getJwtRefreshToken = (userData: TokenInput): string => {
  const refreshToken = jwt.sign(
    { id: userData.id, email: userData.email, role: userData.role },
    JWT_SECRET_REFRESH_TOKEN,
    {
      expiresIn: JWT_EXPIRES_IN_REFRESH_TOKEN as jwt.SignOptions["expiresIn"],
    },
  );

  return refreshToken;
};

export const setRefreshTokenInRedis = async (
  refreshToken: string,
): Promise<void> => {
  // update refresh token for user
  await redis.set(`refreshToken: ${refreshToken}`, refreshToken);
  // set expiry
  const expireIn = REDIS_EXPIRE_REFRESH_TOKEN
    ? Number(REDIS_EXPIRE_REFRESH_TOKEN) * 24 * 60 * 60
    : 604800; // fallback to 7days in seconds
  await redis.expire(`refreshToken: ${refreshToken}`, expireIn); // days * 24 * 60 * 60 -> xxx Seconds
};

export const verifyRefreshTokenAndGetAccessToken = async (
  refreshToken: string,
): Promise<number | AccessToken> => {
  if (!refreshToken) return 400;

  const key = `refreshToken: ${refreshToken}`;

  const isRefreshTokenPresent = await redis.get(key);

  if (!isRefreshTokenPresent) return 404;

  try {
    const user: any = jwt.verify(refreshToken, JWT_SECRET_REFRESH_TOKEN) as {
      email: string;
      id: string;
      role: "User" | "Admin";
    };
    if (!user || !user.email || !user.id || !user.role) return 403;

    const tokenInput: UserData = {
      email: user.email,
      id: user.id,
      role: user.role,
    };
    const accessToken = getJwtAccessToken(tokenInput);

    return { accessToken: accessToken };
  } catch (e: any) {
    console.log(
      `\n-----Err From verifyRefreshTokenAndGetAccessToken-----\nerr details: ${e?.message}\n`,
    );
    return 403;
  }
};
