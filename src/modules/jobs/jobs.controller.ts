import type { Response, NextFunction } from "express";
import * as jobsService from "./jobs.service";
import type { AuthenticatedRequest } from "../../common/middleware/authMiddleware";
import { AppError } from "../../common/errors/AppError";

export async function listJobs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await jobsService.listJobs({
      userId: req.user.id,
      role: req.user.role,
      scope: typeof req.query.scope === "string" ? req.query.scope : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      date: typeof req.query.date === "string" ? req.query.date : undefined,
    });

    return res.status(200).json({
      success: true,
      data: result,
      meta: {
        total: result.length,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function getJobDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await jobsService.getJobDetail({
      jobId: String(req.params.id),
      userId: req.user.id,
      role: req.user.role,
    });

    return res.status(200).json({
      success: true,
      data: result,
      meta: {},
      error: null,
    });
  } catch (error) {
    next(error);
  }
}