import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as locationController from "./location.controller";

const router = Router();

router.post("/", authMiddleware, locationController.createLocationPing);

export default router;