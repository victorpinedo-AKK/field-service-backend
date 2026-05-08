import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as constructionController from "./construction.controller";
import { upload } from "../../middleware/upload";

const router = Router();

router.get("/sites", authMiddleware, constructionController.listConstructionSites);

router.get(
  "/live-crew",
  authMiddleware,
  constructionController.getLiveConstructionCrew,
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

router.post(
  "/sites/:id/notes",
  authMiddleware,
  constructionController.createConstructionNote,
);

// construction.routes.ts
router.get(
  "/sites/:id/daily-report",
  authMiddleware,
  constructionController.getDailyConstructionReport,
);


router.post(
  "/sites/:id/media/upload",
  authMiddleware,
  upload.single("file"),
  constructionController.uploadConstructionMedia,
);

router.get(
  "/sites/:id/activity",
  authMiddleware,
  constructionController.getConstructionActivityFeed,
);

router.get(
  "/sites/:id",
  authMiddleware,
  constructionController.getConstructionSiteDetail,
);

router.delete(
  "/notes/:noteId",
  authMiddleware,
  constructionController.deleteConstructionNote,
);

router.delete(
  "/media/:mediaId",
  authMiddleware,
  constructionController.deleteConstructionMedia,
);

router.get(
  "/missed-clock-outs",
  authMiddleware,
  constructionController.getMissedClockOuts,
);

router.get(
  "/crew",
  authMiddleware,
  constructionController.listConstructionCrew,
);

router.get(
  "/crew-availability",
  authMiddleware,
  constructionController.getConstructionCrewAvailability,
);

router.get(
  "/projects",
  authMiddleware,
  constructionController.listConstructionProjects,
);

router.post(
  "/projects",
  authMiddleware,
  constructionController.createConstructionProject,
);

router.post(
  "/sites/:id/assignments",
  authMiddleware,
  constructionController.assignCrewToSite,
);

router.delete(
  "/sites/:id/assignments/:assignmentId",
  authMiddleware,
  constructionController.removeCrewFromSite,
);

router.delete(
  "/projects/:id",
  authMiddleware,
  constructionController.deleteConstructionProject,
);

router.patch(
  "/projects/:id/status",
  authMiddleware,
  constructionController.updateConstructionProjectStatus,
);

router.get(
  "/sites/:id/tasks",
  authMiddleware,
  constructionController.listConstructionTasks,
);

router.post(
  "/sites/:id/tasks",
  authMiddleware,
  constructionController.createConstructionTask,
);

router.patch(
  "/tasks/:taskId",
  authMiddleware,
  constructionController.updateConstructionTask,
);

router.delete(
  "/tasks/:taskId",
  authMiddleware,
  constructionController.deleteConstructionTask,
);

router.get(
  "/sites/:id/progress",
  authMiddleware,
  constructionController.getConstructionProjectProgress,
);

router.get(
  "/tasks/:taskId/detail",
  authMiddleware,
  constructionController.getConstructionTaskDetail,
);

router.post(
  "/tasks/:taskId/notes",
  authMiddleware,
  constructionController.createConstructionTaskNote,
);

router.post(
  "/tasks/:taskId/media/upload",
  authMiddleware,
  upload.single("file"),
  constructionController.uploadConstructionTaskMedia,
);

router.get(
  "/sites/:id/daily-report",
  authMiddleware,
  constructionController.getConstructionDailyReportV2,
);

router.post(
  "/sites/:id/daily-report",
  authMiddleware,
  constructionController.saveConstructionDailyReport,
);

router.post(
  "/sites/:id/daily-report/submit",
  authMiddleware,
  constructionController.submitConstructionDailyReport,
);
export default router;