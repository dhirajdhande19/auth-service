import axios from "axios";
import { redis } from "../../../config/redis";
import {
  getJwtAccessToken,
  getJwtRefreshToken,
} from "../../token/token.service";
import {
  AccessToken,
  TokenInput,
  TokensAfterLogin,
} from "../../token/token.types";
import { AuthProvider, OAuthUser, UserRole } from "../../user/user.types";
import {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_REDIRECT_URI,
} from "../../../config/env";
import { logger } from "../../../utils/logger";

export const getUserEmailFromGithub = async (
  accessToken: string,
): Promise<number | string> => {
  try {
    if (!accessToken) return 400;
    const res = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.data) return 500;

    return res.data?.email as string;
  } catch (e: any) {
    logger.error({ details: e?.message }, "Error From getUserEmailFromGithub");
    return 500;
  }
};

export const getGithubAccessToken = async (
  code: string,
  codeVerifier: string,
): Promise<number | AccessToken> => {
  try {
    const res = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI,
        code_verifier: codeVerifier,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.data) return 400;

    return res.data?.access_token;
  } catch (e: any) {
    logger.error({ details: e?.message }, "Error From getGithubAccessToken");
    return 500;
  }
};

export const registerGithubOAuthUser = async (
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
        provider: AuthProvider.GitHub,
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
    logger.error({ details: e?.message }, "Error From registerGithubOAuthUser");
    return 500;
  }
};
