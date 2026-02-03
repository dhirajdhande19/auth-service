export const isHashedPassword = (hashedPassword: string): boolean => {
  const bcryptRegex = /^\$2[aby]?\$\d{1,2}\$[./A-Za-z0-9]{53}$/;
  return bcryptRegex.test(hashedPassword);
};

export const isValidUserData = (userData: any): boolean => {
  if (
    !userData.id ||
    !userData.email ||
    !userData.password ||
    !userData.role ||
    (userData.role != "Admin" && userData.role != "User")
  )
    return false;
  return true;
};
