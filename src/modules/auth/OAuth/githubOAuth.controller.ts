import { Request, Response } from "express";
import { GITHUB_CLIENT_ID, GITHUB_REDIRECT_URI } from "../../../config/env";

export const redirectToGithub = async (req: Request, res: Response) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_REDIRECT_URI}&state=${crypto.randomUUID()}`;
  res.redirect(redirectUrl);
};

export const githubCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const code = req.query.code as string;
  console.log(req.query?.code);
  res.json(code);
};
