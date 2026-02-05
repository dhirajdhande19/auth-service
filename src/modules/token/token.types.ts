import { BaseUser, AuthProvider } from "../user/user.types";

export interface TokenInput extends BaseUser {
  provider: AuthProvider | "local";
}

export interface AccessToken {
  accessToken: string;
}

export interface RefreshToken {
  refreshToken: string;
}

export interface TokensAfterLogin extends AccessToken, RefreshToken {}
