import {
  AuthProvider,
  UserData,
  UserRole,
  ValidAuthUserData,
} from "../modules/user/user.types";

export const isHashedPassword = (hashedPassword: string): boolean => {
  const bcryptRegex = /^\$2[aby]?\$\d{1,2}\$[./A-Za-z0-9]{53}$/;
  return bcryptRegex.test(hashedPassword);
};

export const isValidUserData = (userData: UserData): boolean => {
  if (!userData.id || !userData.email || !userData.role) return false;

  if (!(userData.role in UserRole)) return false;

  if (userData.provider === "local") {
    if (!userData.password) return false;
  } else {
    // password should not be present in OAuthUser
    if ("password" in userData) return false;
  }

  return true;
};

export const isUserRole = (value: string): value is UserRole => {
  return Object.values(UserRole).includes(value as UserRole);
};

export const isValidProvider = (
  value: string,
): value is "local" | AuthProvider => {
  if (value === "local") {
    return true;
  }

  return Object.values(AuthProvider).includes(value as AuthProvider);
};

export const isValidAuthUser = (user: ValidAuthUserData): boolean => {
  if (
    !user ||
    !user.email ||
    !user.id ||
    !user.provider ||
    !(user.role in UserRole)
  )
    return false;
  return true;
};
