import type { Response, NextFunction } from "express";
import { AppError } from "../../common/errors/AppError";
import type { AuthenticatedRequest } from "../../common/middleware/authMiddleware";
import * as constructionService from "./construction.service";

function requireUser(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  return req.user;
}

export async function listConstructionSites(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.listConstructionSites({
      userId: user.id,
      role: user.role,
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

export async function getConstructionSiteDetail(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.getConstructionSiteDetail({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
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

export async function getCurrentTimeEntry(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.getCurrentTimeEntry({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
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

export async function clockInToSite(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.clockInToSite({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
      latitude:
        typeof req.body?.latitude === "number" ? req.body.latitude : null,
      longitude:
        typeof req.body?.longitude === "number" ? req.body.longitude : null,
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

export async function clockOutOfSite(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.clockOutOfSite({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
      latitude:
        typeof req.body?.latitude === "number" ? req.body.latitude : null,
      longitude:
        typeof req.body?.longitude === "number" ? req.body.longitude : null,
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

export async function listTimeEntriesForSite(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.listTimeEntriesForSite({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
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