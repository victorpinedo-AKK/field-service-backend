import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as dispatchMessagesController from "./dispatch-messages.controller";

const router = Router();

/**
 * CREATE
 */
router.post(
  "/",
  authMiddleware,
  dispatchMessagesController.createDispatchMessage
);

/**
 * LIST (Inbox)
 */
router.get(
  "/",
  authMiddleware,
  dispatchMessagesController.listDispatchMessages
);

/**
 * 🔥 GET SINGLE MESSAGE (THIS WAS MISSING)
 */
router.get(
  "/:id",
  authMiddleware,
  dispatchMessagesController.getDispatchMessageById
);

/**
 * BLOCKING (must acknowledge)
 */
router.get(
  "/pending-blocking",
  authMiddleware,
  dispatchMessagesController.getPendingBlockingMessages
);

/**
 * ACTIONS
 */
router.post(
  "/:id/read",
  authMiddleware,
  dispatchMessagesController.markDispatchMessageRead
);

router.post(
  "/:id/acknowledge",
  authMiddleware,
  dispatchMessagesController.acknowledgeDispatchMessage
);

/**
 * UPDATE
 */
router.patch(
  "/:id",
  authMiddleware,
  dispatchMessagesController.updateDispatchMessage
);

export default router;