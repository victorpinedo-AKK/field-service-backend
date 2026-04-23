import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import jobsRoutes from "../modules/jobs/jobs.routes";
import hotshotsRoutes from "../modules/hotshots/hotshots.routes";
import usersRoutes from "../modules/users/users.routes";
import dispatchMessagesRoutes from "../modules/dispatch-messages/dispatch-messages.routes";
import teamMessagesRoutes from "../modules/team-messages/team-messages.routes";
import locationRoutes from "../modules/location/location.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { status: "ok" },
    meta: {},
    error: null,
  });
});

router.use("/auth", authRoutes);
router.use("/jobs", jobsRoutes);
router.use("/hotshots", hotshotsRoutes);
router.use("/users", usersRoutes);
router.use("/dispatch-messages", dispatchMessagesRoutes);
router.use("/team-messages", teamMessagesRoutes);
router.use("/location", locationRoutes);

export default router;