import { Request, Response } from "express";
import { LocalUser, UserRole, AuthUserInput } from "../../user/user.types";
import { authenticateUser, createUser } from "./localAuth.service";

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userData: LocalUser = {
    id: crypto.randomUUID(),
    email: req.body.email,
    password: req.body.password,
    role: UserRole.User,
    provider: "local",
  };

  const statusCode = await createUser(userData);

  if (statusCode === 201) {
    // success
    res.status(statusCode).json({ message: "User Registered Successfully!" });
  } else if (statusCode === 409) {
    // conflict
    res.status(statusCode).json({
      message: `User with given email already exists, try new email!`,
    });
  } else if (statusCode === 400) {
    // Unauthorized
    res.status(statusCode).json({ message: "Password/Email are required" });
  } else {
    // internal server issues
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const userData: AuthUserInput = {
    email: req.body?.email,
    password: req.body?.password,
  };

  const result = await authenticateUser(userData);

  if (typeof result === "object" && result != null) {
    res.status(201).json(result);
    return;
  }

  if (result === 401) {
    // Unauthorized
    res.status(result).json({ message: "Unauthorized" });
  } else if (result === 400) {
    // Unauthorized
    res.status(result).json({ message: "Password/Email are required" });
  } else if (result === 404) {
    // user not found
    res.status(result).json({
      message:
        "No user found with given email, Register first! or Invalid User Data",
    });
  } else {
    // internal server issues
    res.status(500).json({ message: "Internal Server Error" });
  }
};
