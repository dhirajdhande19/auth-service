import axios from "axios";
import { URLSearchParams } from "node:url";
import jwt from "jsonwebtoken";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} from "../../../config/env";
import { AuthProvider, OAuthUser, UserRole } from "../../user/user.types";
import { redis } from "../../../config/redis";
import {
  getJwtAccessToken,
  getJwtRefreshToken,
} from "../../token/token.service";

import { TokensAfterLogin, TokenInput } from "../../token/token.types";
import { logger } from "../../../utils/logger";

export const googleAuth = async (code: string): Promise<number | any> => {
  try {
    if (
      !code ||
      !GOOGLE_CLIENT_ID ||
      !GOOGLE_REDIRECT_URI ||
      !GOOGLE_CLIENT_SECRET
    )
      return 404;

    const params = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      params.toString(),
      { headers: { "content-Type": "application/x-www-form-urlencoded" } },
    );
    if (!response.data) return 500;

    const { id_token } = response.data;
    const googleUser = jwt.decode(id_token);

    if (!googleUser) return 500;

    return googleUser;
  } catch (e: any) {
    logger.error({ details: e?.message }, "Error From googleAuth");
    return 500;
  }
};

export const registerGoogleOAuthUser = async (
  email: string,
): Promise<number | TokensAfterLogin> => {
  try {
    if (!email) return 400;
    const isPrevUser = await redis.hgetall(`user: ${email}`);

    if (isPrevUser && isPrevUser.provider === "local") return 409;

    // if no prevUser, first register user (Create Account) then login
    if (!isPrevUser || Object.keys(isPrevUser).length === 0) {
      const userData: OAuthUser = {
        id: crypto.randomUUID(),
        email: email,
        role: UserRole.User,
        provider: AuthProvider.Google,
      };

      await redis.hset(`user: ${email}`, userData);
    }

    const user = await redis.hgetall(`user: ${email}`);

    const tokenInput: TokenInput = {
      id: user.id,
      email: email,
      role: user.role as UserRole,
      provider: user.provider as AuthProvider,
    };

    const accessToken = getJwtAccessToken(tokenInput);
    const refreshToken = getJwtRefreshToken(tokenInput);

    if (!accessToken || !refreshToken) return 500;

    return { accessToken: accessToken, refreshToken: refreshToken };
  } catch (e: any) {
    logger.error({ details: e?.message }, "Error From registerGoogleOAuthUser");
    return 500;
  }
};
