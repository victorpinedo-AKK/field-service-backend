import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as teamMessagesController from "./team-messages.controller";

const router = Router();

router.get("/", authMiddleware, teamMessagesController.listTeamMessages);
router.post("/", authMiddleware, teamMessagesController.createTeamMessage);

export default router;