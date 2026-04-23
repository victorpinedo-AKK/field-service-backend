import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as dispatchMessagesController from "./dispatch-messages.controller";

const router = Router();

router.post("/", authMiddleware, dispatchMessagesController.createDispatchMessage);
router.get("/", authMiddleware, dispatchMessagesController.listDispatchMessages);
router.post("/:id/read", authMiddleware, dispatchMessagesController.markDispatchMessageRead);
router.patch("/:id", authMiddleware, dispatchMessagesController.updateDispatchMessage);
router.post("/:id/acknowledge", authMiddleware, dispatchMessagesController.acknowledgeDispatchMessage,);

export default router;