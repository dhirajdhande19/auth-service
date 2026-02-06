import { Request, Response } from "express";
import {
  revokeAllSessions,
  revokeCurrentSession,
  verifyRefreshTokenAndGetAccessToken,
} from "./token.service";

// refresh token (token rotation)
export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const refreshToken = req.body.refreshToken as string;

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
      error: "Unauthorized",
      details: "refreshToken is expired, re-login to create new refreshToken",
    });
  } else if (result === 403) {
    res.status(result).json({ error: "Unauthorized" });
  } else if (result === 401) {
    res.status(result).json({ error: "Invalid User Data" });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// invalidate sessions
export const invalidateSingleSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const refreshToken = req.body?.refreshToken as string;

  const result = await revokeCurrentSession(refreshToken);

  if (result === 200) {
    res
      .status(result)
      .json({ message: "Successfully revoked current session" });
  } else if (result === 400) {
    res.status(result).json({ error: "Refresh Token is required!" });
  } else if (result === 404) {
    res.status(result).json({ error: "Invalid/Expired Refresh Token" });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const invalidateAllSesssions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const refreshToken = req.body?.refreshToken as string;

  const result = await revokeAllSessions(refreshToken);

  if (result === 200) {
    res.status(result).json({ message: "Successfully revoked all sessions" });
  } else if (result === 400) {
    res.status(result).json({ error: "Refresh Token is required!" });
  } else if (result === 404) {
    res.status(result).json({ error: "Invalid/Expired Refresh Token" });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
