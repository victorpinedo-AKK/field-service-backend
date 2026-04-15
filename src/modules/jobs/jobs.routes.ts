import { Router } from "express";
import * as jobsController from "./jobs.controller";
import { authMiddleware } from "../../common/middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, jobsController.listJobs);
router.get("/:id", authMiddleware, jobsController.getJobDetail);

export default router;