import { Request, Response } from "express";
import { googleAuth, registerGoogleOAuthUser } from "./googleOAuth.service";
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from "../../../config/env";
import { setRefreshTokenInRedis } from "../../token/token.service";

// redirect to google for confirmation (get user consent)
export const redirectToGoogle = async (req: Request, res: Response) => {
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile&access_type=offline&include_granted_scopes=true&state=xyz123&prompt=consent`;
  res.redirect(redirectUrl);
};

export const googleCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  let code = req.query.code as string;

  const googleUser = await googleAuth(code);

  const email = googleUser.email as string;

  const result = await registerGoogleOAuthUser(email);

  // success case
  if (typeof result === "object" && result != null) {
    const refreshToken = result.refreshToken;
    if (!refreshToken) {
      res.status(400).json({ error: "Refresh Token is required" });
      return;
    }
    await setRefreshTokenInRedis(refreshToken, email);
    res.status(201).json(result);
    return;
  }

  // failure cases
  if (result === 409) {
    res
      .status(result)
      .json({ message: "User already exists, try loging in locally" });
  } else if (result === 400) {
    res.status(result).json({ error: "Email is required" });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
