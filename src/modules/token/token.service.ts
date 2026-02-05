import {
  JWT_EXPIRES_IN_ACCESS_TOKEN,
  JWT_EXPIRES_IN_REFRESH_TOKEN,
  JWT_SECRET_ACCESS_TOKEN,
  JWT_SECRET_REFRESH_TOKEN,
  REDIS_EXPIRE_REFRESH_TOKEN,
} from "../../config/env";
import { redis } from "../../config/redis";
import { isValidAuthUser, isValidProvider } from "../../utils/helper";
import { ValidAuthUserData, UserData } from "../user/user.types";
import { TokenInput, AccessToken } from "./token.types";
import jwt from "jsonwebtoken";

export const getJwtAccessToken = (userData: TokenInput): string => {
  try {
    const accessToken = jwt.sign(
      {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        provider: userData.provider,
      },
      JWT_SECRET_ACCESS_TOKEN,
      {
        expiresIn: JWT_EXPIRES_IN_ACCESS_TOKEN as jwt.SignOptions["expiresIn"],
      },
    );

    return accessToken;
  } catch (e: any) {
    console.log(
      `\n-----Err from getJwtAccessToken-----\nerr details: ${e?.message}`,
    );
    return "";
  }
};

export const getJwtRefreshToken = (userData: TokenInput): string => {
  try {
    const refreshToken = jwt.sign(
      {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        provider: userData.provider,
      },
      JWT_SECRET_REFRESH_TOKEN,
      {
        expiresIn: JWT_EXPIRES_IN_REFRESH_TOKEN as jwt.SignOptions["expiresIn"],
      },
    );

    return refreshToken;
  } catch (e: any) {
    console.log(
      `\n-----Err from getJwtRefreshToken-----\nerr details: ${e?.message}`,
    );
    return "";
  }
};

export const setRefreshTokenInRedis = async (
  refreshToken: string,
): Promise<void> => {
  try {
    // update refresh token for user
    await redis.set(`refreshToken: ${refreshToken}`, refreshToken);
    // set expiry
    const expireIn = REDIS_EXPIRE_REFRESH_TOKEN
      ? Number(REDIS_EXPIRE_REFRESH_TOKEN) * 24 * 60 * 60
      : 604800; // fallback to 7days in seconds
    await redis.expire(`refreshToken: ${refreshToken}`, expireIn); // days * 24 * 60 * 60 -> xxx Seconds
  } catch (e: any) {
    console.log(
      `\n-----Err from getJwtRefreshToken-----\nerr details: ${e?.message}`,
    );
  }
};

export const verifyRefreshTokenAndGetAccessToken = async (
  refreshToken: string,
): Promise<number | AccessToken> => {
  if (!refreshToken) return 400;

  try {
    const key = `refreshToken: ${refreshToken}`;

    const isRefreshTokenPresent = await redis.get(key);

    if (!isRefreshTokenPresent) return 404;

    const user: ValidAuthUserData = jwt.verify(
      refreshToken,
      JWT_SECRET_REFRESH_TOKEN,
    ) as UserData;

    if (!isValidProvider(user.provider)) return 404;

    if (!isValidAuthUser(user)) return 401;

    const tokenInput: TokenInput = {
      email: user.email,
      id: user.id,
      role: user.role,
      provider: user.provider,
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
