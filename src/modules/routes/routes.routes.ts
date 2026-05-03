import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as routesController from "./routes.controller";

const router = Router();

router.get(
  "/active/notifications",
  authMiddleware,
  routesController.getActiveRouteNotifications,
);

// other route routes below

export default router;