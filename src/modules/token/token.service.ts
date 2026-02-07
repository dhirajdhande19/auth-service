import {
  JWT_EXPIRES_IN_ACCESS_TOKEN,
  JWT_EXPIRES_IN_REFRESH_TOKEN,
  JWT_SECRET_ACCESS_TOKEN,
  JWT_SECRET_REFRESH_TOKEN,
  REDIS_EXPIRE_REFRESH_TOKEN,
} from "../../config/env";
import { redis } from "../../config/redis";
import { isValidAuthUser, isValidProvider } from "../../utils/helper";
import { logger } from "../../utils/logger";
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
    logger.error({ details: e?.message }, "Error from getJwtAccessToken");
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
    logger.error({ details: e?.message }, "Error from getJwtRefreshToken");
    return "";
  }
};

export const setRefreshTokenInRedis = async (
  refreshToken: string,
  email: string,
): Promise<void> => {
  try {
    // calculate expiry
    const expireIn = REDIS_EXPIRE_REFRESH_TOKEN
      ? Number(REDIS_EXPIRE_REFRESH_TOKEN) * 24 * 60 * 60
      : 604800; // fallback to 7days in seconds

    const isNew = await redis.exists(`refreshTokens: ${email}`); // auto expires)
    if (isNew === 0) await redis.expire(`refreshTokens: ${email}`, expireIn);

    await redis
      .multi()
      .set(`refreshToken: ${refreshToken}`, email, "EX", expireIn) // to later revoke single session
      .sadd(`refreshTokens: ${email}`, refreshToken) // to later revoke all sessions
      .exec();
  } catch (e: any) {
    logger.error({ details: e?.message }, "Error from setRefreshTokenInRedis");
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
    logger.error(
      { details: e?.message },
      "Error from verifyRefreshTokenAndGetAccessToken",
    );
    return 403;
  }
};

export const revokeCurrentSession = async (
  refreshToken: string,
): Promise<number> => {
  try {
    if (!refreshToken) return 400;
    const key = `refreshToken: ${refreshToken}`;
    const email = await redis.get(key);
    if (!email) return 404;

    await redis
      .multi()
      .del(key) // revoke curr session
      .srem(`refreshTokens:${email}`, refreshToken) // revoke curr session from all sessions list
      .exec();

    return 200;
  } catch (e: any) {
    logger.error({ details: e?.message }, "Error from revokeCurrentSession");
    return 403;
  }
};

export const revokeAllSessions = async (
  refreshToken: string,
): Promise<number> => {
  try {
    if (!refreshToken) return 400;
    const key = `refreshToken: ${refreshToken}`;
    const email = await redis.get(key);

    if (!email) return 404;

    const tokens = await redis.smembers(`refreshTokens:${email}`);

    const pipeline = redis.multi();
    tokens.forEach((token) => pipeline.del(`refreshToken:${token}`)); // delete all tokens from list
    pipeline.del(`refreshTokens:${email}`); // delete list of tokens
    await pipeline.exec();

    return 200;
  } catch (e: any) {
    logger.error({ details: e?.message }, "Error from revokeAllSessions");
    return 403;
  }
};
