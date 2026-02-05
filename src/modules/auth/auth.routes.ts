import Router from "express";
import { validate } from "../../middlewares/validate.middleware";
import { authUserSchema, refreshTokenSchema } from "./auth.schema";
import { wrapAsync } from "../../middlewares/wrapAsync.middleware";
import {
  googleCallback,
  redirectToGoogle,
} from "./OAuth/googleOAuth.controller";
import { loginUser, registerUser } from "./local/localAuth.controller";
import { refreshToken } from "../token/token.controller";
import { redirectToGithub } from "./OAuth/githubOAuth.controller";

const router = Router();
// local auth
router.post("/register", validate(authUserSchema), wrapAsync(registerUser));
router.post("/login", validate(authUserSchema), wrapAsync(loginUser));
router.get("/refresh", validate(refreshTokenSchema), wrapAsync(refreshToken));

// OAuth
// google
router.get("/google", wrapAsync(redirectToGoogle));
router.get("/google/callback", wrapAsync(googleCallback));
// github
router.get("/github", wrapAsync(redirectToGithub));
router.get("/github/callback", wrapAsync(redirectToGithub));
export default router;
