import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as dispatchMessagesController from "./dispatch-messages.controller";

const router = Router();

router.post("/", authMiddleware, dispatchMessagesController.createDispatchMessage);
router.get("/", authMiddleware, dispatchMessagesController.listDispatchMessages);
router.get("/pending-blocking", authMiddleware, dispatchMessagesController.getPendingBlockingMessages);
router.post("/:id/read", authMiddleware, dispatchMessagesController.markDispatchMessageRead);
router.post("/:id/acknowledge", authMiddleware, dispatchMessagesController.acknowledgeDispatchMessage);
router.patch("/:id", authMiddleware, dispatchMessagesController.updateDispatchMessage);


export default router;