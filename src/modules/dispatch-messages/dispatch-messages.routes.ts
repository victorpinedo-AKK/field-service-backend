import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as dispatchMessagesController from "./dispatch-messages.controller";

const router = Router();

router.post(
  "/",
  authMiddleware,
  dispatchMessagesController.createDispatchMessage,
);

router.get(
  "/",
  authMiddleware,
  dispatchMessagesController.listDispatchMessages,
);

// IMPORTANT: this must come before "/:id"
router.get(
  "/pending-blocking",
  authMiddleware,
  dispatchMessagesController.getPendingBlockingMessages,
);

// IMPORTANT: this must come after specific routes
router.get(
  "/:id",
  authMiddleware,
  dispatchMessagesController.getDispatchMessageById,
);

router.post(
  "/:id/read",
  authMiddleware,
  dispatchMessagesController.markDispatchMessageRead,
);

router.post(
  "/:id/acknowledge",
  authMiddleware,
  dispatchMessagesController.acknowledgeDispatchMessage,
);

router.patch(
  "/:id",
  authMiddleware,
  dispatchMessagesController.updateDispatchMessage,
);

export default router;