import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as hotshotsController from "./hotshots.controller";
import { upload } from "../../middleware/upload";


const router = Router();

console.log("HOTSHOTS ROUTES LOADED");

router.post("/jobs", authMiddleware, hotshotsController.createHotshotJob);
router.get("/jobs", authMiddleware, hotshotsController.listHotshotJobs);
router.get("/jobs/:id", authMiddleware, hotshotsController.getHotshotJobDetail);
router.post("/jobs/:id/notes", authMiddleware, hotshotsController.createHotshotNote);
router.post("/jobs/:id/media/upload-url", authMiddleware, hotshotsController.createHotshotMediaUploadUrl);
router.post("/jobs/:id/media", authMiddleware, hotshotsController.finalizeHotshotMedia);
router.post("/jobs/:id/accept", authMiddleware, hotshotsController.acceptHotshotJob);
router.post("/jobs/:id/release", authMiddleware, hotshotsController.releaseHotshotJob);
router.post("/jobs/:id/pickup", authMiddleware, hotshotsController.pickupHotshotJob);
router.post("/jobs/:id/deliver", authMiddleware, hotshotsController.deliverHotshotJob);
router.delete("/jobs/:jobId/media/:mediaId", authMiddleware, hotshotsController.softDeleteHotshotMedia);
router.post(
  "/jobs/:id/media/upload",
  authMiddleware,
  upload.single("file"),
  hotshotsController.uploadHotshotMedia,
  router.post("/jobs/:id/items", authMiddleware, hotshotsController.createHotshotChecklistItem);
router.post("/jobs/:id/items/:itemId/complete", authMiddleware, hotshotsController.completeHotshotChecklistItem);
);
router.delete("/jobs/:id", authMiddleware, hotshotsController.deleteHotshotJob);

export default router;