import type { Response, NextFunction } from "express";
import { AppError } from "../../common/errors/AppError";
import type { AuthenticatedRequest } from "../../common/middleware/authMiddleware";
import * as teamMessagesService from "./team-messages.service";

export async function listTeamMessages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await teamMessagesService.listTeamMessages({
      userId: req.user.id,
      role: req.user.role,
      teamId:
        typeof req.query.team_id === "string" ? req.query.team_id : undefined,
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

export async function createTeamMessage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await teamMessagesService.createTeamMessage({
      userId: req.user.id,
      role: req.user.role,
      body: typeof req.body?.body === "string" ? req.body.body : "",
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
export async function acknowledgeTeamMessage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const messageId = String(req.params.id);

    const result = await teamMessagesService.acknowledgeTeamMessage(
      messageId,
      req.user.id,
    );

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