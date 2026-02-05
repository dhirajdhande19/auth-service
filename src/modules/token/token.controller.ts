import { Request, Response } from "express";
import { verifyRefreshTokenAndGetAccessToken } from "./token.service";

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
      message: "Unauthorized",
      details: "refreshToken is expired, re-login to create new refreshToken",
    });
  } else if (result === 403) {
    res.status(result).json({ message: "Unauthorized" });
  } else if (result === 401) {
    res.status(result).json({ message: "Invalid User Data" });
  } else {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
