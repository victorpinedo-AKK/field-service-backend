import { Router } from "express";
import * as authController from "./auth.controller";
import { authMiddleware } from "../../common/middleware/authMiddleware";

const router = Router();

router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.me);

export default router;