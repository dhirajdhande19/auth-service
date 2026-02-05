export enum UserRole {
  User = "User",
  Admin = "Admin",
}

export enum AuthProvider {
  Google = "google",
  GitHub = "github",
}

export interface BaseUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface LocalUser extends BaseUser {
  provider: "local";
  password: string;
}

export interface OAuthUser extends BaseUser {
  provider: AuthProvider;
}

export type UserData = LocalUser | OAuthUser;

export interface ValidAuthUserData extends BaseUser {
  provider: "local" | AuthProvider;
}

export interface AuthUserInput {
  email: string;
  password?: string;
}
