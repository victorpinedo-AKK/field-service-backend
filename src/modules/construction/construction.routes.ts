import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as constructionController from "./construction.controller";

const router = Router();

router.get("/sites", authMiddleware, constructionController.listConstructionSites);

router.get(
  "/sites/:id",
  authMiddleware,
  constructionController.getConstructionSiteDetail,
);

router.get(
  "/sites/:id/current-time-entry",
  authMiddleware,
  constructionController.getCurrentTimeEntry,
);

router.get(
  "/sites/:id/time-entries",
  authMiddleware,
  constructionController.listTimeEntriesForSite,
);

router.post(
  "/sites/:id/clock-in",
  authMiddleware,
  constructionController.clockInToSite,
);

router.post(
  "/sites/:id/clock-out",
  authMiddleware,
  constructionController.clockOutOfSite,
);



export default router;