import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as usersController from "./users.controller";

const router = Router();

router.get("/", authMiddleware, usersController.listUsers);
router.post("/", authMiddleware, usersController.createUser);
router.patch("/:id", authMiddleware, usersController.updateUser);

export default router;