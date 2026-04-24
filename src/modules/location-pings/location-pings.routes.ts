import { Router } from "express";
import { authMiddleware } from "../../common/middleware/authMiddleware";
import * as locationPingsController from "./location-pings.controller";

const router = Router();

console.log("LOCATION PINGS ROUTES LOADED");

router.post("/", authMiddleware, locationPingsController.createLocationPing);
router.get("/live", authMiddleware, locationPingsController.listLiveLocations);

export default router;