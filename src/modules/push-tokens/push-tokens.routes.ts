import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as pushTokensController from "./push-tokens.controller";

const router = Router();

router.post("/", authMiddleware, pushTokensController.savePushToken);

export default router;