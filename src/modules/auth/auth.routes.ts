import Router from "express";
import { loginUser, refreshToken, registerUser } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authUserSchema, refreshTokenSchema } from "./auth.schema";
import { wrapAsync } from "../../middlewares/wrapAsync.middleware";
const router = Router();

router.post("/register", validate(authUserSchema), wrapAsync(registerUser));
router.post("/login", validate(authUserSchema), wrapAsync(loginUser));
router.get("/refresh", validate(refreshTokenSchema), wrapAsync(refreshToken));

export default router;
