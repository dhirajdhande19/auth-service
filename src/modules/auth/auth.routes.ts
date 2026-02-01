import Router from "express";
import { loginUser, registerUser } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authUserSchema } from "./auth.schema";
import { wrapAsync } from "../../middlewares/wrapAsync.middleware";
const router = Router();

router.get("/register", validate(authUserSchema), wrapAsync(registerUser));
router.get("/login", validate(authUserSchema), wrapAsync(loginUser));

export default router;
