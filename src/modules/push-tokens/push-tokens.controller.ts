import type { Response, NextFunction } from "express";
import { AppError } from "../../common/errors/AppError";
import type { AuthenticatedRequest } from "../../common/middleware/authMiddleware";
import * as pushTokensService from "./push-tokens.service";

export async function savePushToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const token = typeof req.body?.token === "string" ? req.body.token : "";

    if (!token) {
      throw new AppError("Push token is required", 400, "INVALID_REQUEST");
    }

    const result = await pushTokensService.savePushToken({
      userId: req.user.id,
      token,
      platform:
        typeof req.body?.platform === "string" ? req.body.platform : undefined,
    });

    return res.status(201).json({
      success: true,
      data: { id: result.id },
      meta: {},
      error: null,
    });
  } catch (error) {
    next(error);
  }
}