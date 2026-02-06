import Router from "express";
import { validate } from "../../middlewares/validate.middleware";
import { refreshTokenSchema } from "./token.schema";
import { wrapAsync } from "../../middlewares/wrapAsync.middleware";
import {
  invalidateAllSesssions,
  invalidateSingleSession,
  refreshToken,
} from "./token.controller";
const router = Router();

// token rotation -> Refresh token
router.get("/refresh", validate(refreshTokenSchema), wrapAsync(refreshToken));

// invalidate current session (logout from current device)
router.get(
  "/invalidate",
  validate(refreshTokenSchema),
  wrapAsync(invalidateSingleSession),
);
// invalidate all session (logout from all devices)
router.get(
  "/invalidate/all",
  validate(refreshTokenSchema),
  wrapAsync(invalidateAllSesssions),
);

export default router;
