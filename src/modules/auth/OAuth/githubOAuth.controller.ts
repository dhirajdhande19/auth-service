import { Request, Response } from "express";
import {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_REDIRECT_URI,
} from "../../../config/env";
import {
  generateCodeChallenge,
  generateCodeVerifier,
} from "../../../utils/pkce";
import axios from "axios";
import {
  getGithubAccessToken,
  getUserEmailFromGithub,
  registerGithubOAuthUser,
} from "./githubOAuth.service";
import { setRefreshTokenInRedis } from "../../token/token.service";

export const redirectToGithub = async (req: Request, res: Response) => {
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  res.cookie("github_oauth_state", state, { httpOnly: true });
  res.cookie("github_code_verifier", codeVerifier, { httpOnly: true });

  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_REDIRECT_URI}&state=${state}&scope=user:email&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  res.redirect(redirectUrl);
};

export const githubCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { code, state } = req.query;

  const storedState = req.cookies.github_oauth_state;

  if (!code || !state || !storedState || state !== storedState) {
    res.status(400).json({ error: "Invalid state or code" });
    return;
  }

  const codeVerifier = req.cookies.github_code_verifier;

  if (!codeVerifier) {
    res.status(400).json({ error: "Invalid codeVerifier" });
    return;
  }

  const accessToken = await getGithubAccessToken(
    String(code),
    String(codeVerifier),
  );

  if (!accessToken) {
    res.status(400).json({ error: "failed to get access token" });
    return;
  }

  const email = await getUserEmailFromGithub(accessToken.toString());

  if (!email || typeof email === "number") {
    res.status(400).json({ error: "Invalid email" });
    return;
  }

  const result = await registerGithubOAuthUser(email);

  // success case
  if (typeof result === "object" && result != null) {
    const refreshToken = result.refreshToken;
    if (!refreshToken) {
      res.status(400).json({ error: "Refresh Token is required" });
      return;
    }

    await setRefreshTokenInRedis(refreshToken);
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
