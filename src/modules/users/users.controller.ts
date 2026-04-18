import type { NextFunction, Response } from "express";
import { AppError } from "../../common/errors/AppError";
import type { AuthenticatedRequest } from "../../common/middleware/authMiddleware";
import * as usersService from "./users.service";

export async function listUsers(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await usersService.listUsers({
      actorRole: req.user.role,
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

export async function createUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await usersService.createUser({
      actorRole: req.user.role,
      firstName:
        typeof req.body?.first_name === "string" ? req.body.first_name : "",
      lastName:
        typeof req.body?.last_name === "string" ? req.body.last_name : "",
      email: typeof req.body?.email === "string" ? req.body.email : "",
      password: typeof req.body?.password === "string" ? req.body.password : "",
      role: typeof req.body?.role === "string" ? req.body.role : "",
      isActive:
        typeof req.body?.is_active === "boolean" ? req.body.is_active : true,
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

export async function updateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await usersService.updateUser({
      actorRole: req.user.role,
      userId: String(req.params.id),
      firstName:
        typeof req.body?.first_name === "string" ? req.body.first_name : undefined,
      lastName:
        typeof req.body?.last_name === "string" ? req.body.last_name : undefined,
      email: typeof req.body?.email === "string" ? req.body.email : undefined,
      password:
        typeof req.body?.password === "string" ? req.body.password : undefined,
      role: typeof req.body?.role === "string" ? req.body.role : undefined,
      isActive:
        typeof req.body?.is_active === "boolean" ? req.body.is_active : undefined,
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