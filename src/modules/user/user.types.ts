export interface UserData {
  id: string;
  role: "User" | "Admin";
  email: string;
  password?: string;
}

export interface AuthUserInput {
  email: string;
  password?: string;
}

export interface TokenInput extends AuthUserInput {
  id: string;
  role: "User" | "Admin";
}

export interface AccessToken {
  accessToken: string;
}

export interface RefreshToken {
  refreshToken: string;
}

export interface TokensAfterLogin extends AccessToken, RefreshToken {}
