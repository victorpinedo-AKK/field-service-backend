import type { Response, NextFunction } from "express";
import { AppError } from "../../common/errors/AppError";
import type { AuthenticatedRequest } from "../../common/middleware/authMiddleware";
import * as locationService from "./location.service";

export async function createLocationPing(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await locationService.createLocationPing({
      userId: req.user.id,
      workOrderId:
        typeof req.body?.work_order_id === "string" ? req.body.work_order_id : "",
      latitude:
        typeof req.body?.latitude === "number" ? req.body.latitude : NaN,
      longitude:
        typeof req.body?.longitude === "number" ? req.body.longitude : NaN,
      accuracy:
        typeof req.body?.accuracy === "number" ? req.body.accuracy : null,
    });

    return res.status(201).json({
      success: true,
      data: result,
      meta: {},
      error: null,
    });
  } catch (error) {
    next(error);
  }
}