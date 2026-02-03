import { Request, Response } from "express";
import {
  authenticateUser,
  createUser,
  verifyRefreshTokenAndGetAccessToken,
} from "./auth.service";
import { AuthUserInput } from "../user/user.types";

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userData: AuthUserInput = {
    email: req.body.email,
    password: req.body?.password,
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
  } else if (statusCode === 401) {
    // Unauthorized
    res.status(statusCode).json({ message: "Unauthorized" });
  } else {
    // internal server issues
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const userData: AuthUserInput = {
    email: req.body.email,
    password: req.body.password,
  };

  const result = await authenticateUser(userData);

  if (typeof result === "object" && result != null) {
    res.status(201).json(result);
    return;
  }

  if (result === 401) {
    // Unauthorized
    res.status(result).json({ message: "Unauthorized" });
  } else if (result === 404) {
    // user not found
    res.status(result).json({
      message: "No user found with given email, Register first!",
    });
  } else {
    // internal server issues
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// refresh token (token rotation)
export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { refreshToken } = req.body;

  if (typeof refreshToken != "string") {
    res.status(404).json({
      message: "Bad Request",
      details: "refreshToken should be string!",
    });
    return;
  }

  const result = await verifyRefreshTokenAndGetAccessToken(refreshToken);

  if (
    typeof result === "object" &&
    result != null &&
    result.accessToken != null
  ) {
    res.status(200).json(result);
    return;
  }

  if (result === 404) {
    res.status(result).json({
      message: "Unauthorized",
      details: "refreshToken is expired, re-login to create new refreshToken",
    });
  } else if (result === 403) {
    res.status(result).json({ message: "Unauthorized" });
  } else {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
