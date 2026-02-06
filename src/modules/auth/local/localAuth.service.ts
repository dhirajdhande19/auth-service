import { compare, hash } from "bcryptjs";
import { LocalUser, AuthUserInput } from "../../user/user.types";
import { TokensAfterLogin, TokenInput } from "../../token/token.types";
import { redis } from "../../../config/redis";
import {
  isHashedPassword,
  isUserRole,
  isValidProvider,
  isValidUserData,
} from "../../../utils/helper";
import {
  getJwtAccessToken,
  getJwtRefreshToken,
  setRefreshTokenInRedis,
} from "../../token/token.service";

export const createUser = async (user: LocalUser): Promise<number> => {
  const email = user.email;
  const password = user.password;
  // unauthorized
  if (!password || !email) return 400;
  try {
    const isPrevUser = await redis.hget(`user: ${email}`, "id");
    if (isPrevUser) return 409; // conflict (user already present)

    const hashedPassword = await hash(password, 10);
    if (!isHashedPassword(hashedPassword)) return 500; // server err

    await redis.hset(`user: ${email}`, { ...user, password: hashedPassword });
    // user created successfully
    return 201;
  } catch (e: any) {
    console.error(
      `\n-----Err from createUser-----\nerr details: ${e?.message}`,
    );
    return 500;
  }
};

export const authenticateUser = async (
  user: AuthUserInput,
): Promise<number | TokensAfterLogin> => {
  try {
    const email = user?.email;
    const password = user?.password;

    // unauthorized
    if (!password || !email) return 400;

    const isPrevUser = await redis.hget(`user: ${email}`, "id");
    const userData = await redis.hgetall(`user: ${email}`);

    // making sure userData isn't empty
    if (!isPrevUser || Object.keys(userData).length === 0) return 404;

    // if role isn't valid we return 404
    if (!isUserRole(userData.role)) return 404;

    const validUserData: LocalUser = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      provider: "local",
      password: userData.password,
    };

    if (!isValidUserData(validUserData)) return 404;

    const hashedPassword = userData?.password;
    if (!hashedPassword) return 500;

    const isPasswordCorrect = await compare(password, hashedPassword);
    if (!isPasswordCorrect) return 401;

    if (!isValidProvider(userData.provider)) return 404;

    const tokenInput: TokenInput = {
      id: userData.id,
      role: userData.role,
      provider: userData.provider,
      email: userData.email,
    };

    const accessToken = getJwtAccessToken(tokenInput);

    const refreshToken = getJwtRefreshToken(tokenInput);

    if (!accessToken || !refreshToken) return 500;

    await setRefreshTokenInRedis(refreshToken, userData.email);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  } catch (e: any) {
    console.error(
      `\n-----Err from authenticateUser-----\nerr details: ${e?.message}`,
    );
    return 500;
  }
};
