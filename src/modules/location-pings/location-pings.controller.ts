import type { Response, NextFunction } from "express";
import { AppError } from "../../common/errors/AppError";
import type { AuthenticatedRequest } from "../../common/middleware/authMiddleware";
import * as locationPingsService from "./location-pings.service";

export async function createLocationPing(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await locationPingsService.createLocationPing({
      userId: req.user.id,
      role: req.user.role,
      workOrderId:
        typeof req.body?.work_order_id === "string"
          ? req.body.work_order_id
          : "",
      latitude:
        typeof req.body?.latitude === "number"
          ? req.body.latitude
          : Number(req.body?.latitude),
      longitude:
        typeof req.body?.longitude === "number"
          ? req.body.longitude
          : Number(req.body?.longitude),
      accuracy:
        typeof req.body?.accuracy === "number"
          ? req.body.accuracy
          : undefined,
      speed:
        typeof req.body?.speed === "number" ? req.body.speed : undefined,
      heading:
        typeof req.body?.heading === "number" ? req.body.heading : undefined,
      batteryLevel:
        typeof req.body?.battery_level === "number"
          ? req.body.battery_level
          : undefined,
      isMocked:
        typeof req.body?.is_mocked === "boolean"
          ? req.body.is_mocked
          : undefined,
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

export async function listLiveLocations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await locationPingsService.listLiveLocations({
      userId: req.user.id,
      role: req.user.role,
      division:
        typeof req.query.division === "string"
          ? req.query.division
          : undefined,
    });

    return res.status(200).json({
      success: true,
      data: result,
      meta: { total: result.length },
      error: null,
    });
  } catch (error) {
    next(error);
  }
}
export async function getRouteTrail(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await locationPingsService.getRouteTrail({
      userId: req.user.id,
      role: req.user.role,
      workOrderId:
        typeof req.params.workOrderId === "string"
          ? req.params.workOrderId
          : "",
    });

    return res.status(200).json({
      success: true,
      data: result,
      meta: { total: result.length },
      error: null,
    });
  } catch (error) {
    next(error);
  }
}