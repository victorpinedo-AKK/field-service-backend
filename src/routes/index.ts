import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import jobsRoutes from "../modules/jobs/jobs.routes";
import hotshotsRoutes from "../modules/hotshots/hotshots.routes";
import usersRoutes from "../modules/users/users.routes";

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

export default router;
