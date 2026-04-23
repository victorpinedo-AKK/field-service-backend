import type { Response, NextFunction } from "express";
import { AppError } from "../../common/errors/AppError";
import type { AuthenticatedRequest } from "../../common/middleware/authMiddleware";
import * as dispatchMessagesService from "./dispatch-messages.service";

export async function createDispatchMessage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await dispatchMessagesService.createDispatchMessage({
      userId: req.user.id,
      role: req.user.role,
      title: typeof req.body?.title === "string" ? req.body.title : "",
      body: typeof req.body?.body === "string" ? req.body.body : "",
      
      
      requiresAcknowledgement:
        typeof req.body?.requires_acknowledgement === "boolean" ? req.body.requires_acknowledgement: undefined,
      priority:
        typeof req.body?.priority === "string" ? req.body.priority : undefined,
      targetScope:
        typeof req.body?.target_scope === "string"
          ? req.body.target_scope
          : undefined,
      targetRole:
        typeof req.body?.target_role === "string"
          ? req.body.target_role
          : undefined,
      targetUserId:
        typeof req.body?.target_user_id === "string"
          ? req.body.target_user_id
          : undefined,
      targetWorkOrderId:
        typeof req.body?.target_work_order_id === "string"
          ? req.body.target_work_order_id
          : undefined,
      targetCompanyId:
        typeof req.body?.target_company_id === "string"
          ? req.body.target_company_id
          : undefined,
      messageCategory:
        typeof req.body?.message_category === "string"
          ? req.body.message_category
          : undefined,
      expiresAt:
        typeof req.body?.expires_at === "string"
          ? req.body.expires_at
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

export async function getPendingBlockingMessages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await dispatchMessagesService.getPendingBlockingMessages({
      userId: req.user.id,
      role: req.user.role,
      jobId:
        typeof req.query.job_id === "string" ? req.query.job_id : undefined,
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

export async function listDispatchMessages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await dispatchMessagesService.listDispatchMessages({
      userId: req.user.id,
      role: req.user.role,
      jobId:
        typeof req.query.job_id === "string" ? req.query.job_id : undefined,
      unreadOnly:
        typeof req.query.unread_only === "string"
          ? req.query.unread_only === "true"
          : false,
      targetScope:
        typeof req.query.target_scope === "string"
          ? req.query.target_scope
          : undefined,
      messageCategory:
        typeof req.query.message_category === "string"
          ? req.query.message_category
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

export async function markDispatchMessageRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await dispatchMessagesService.markDispatchMessageRead({
      id: String(req.params.id),
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

export async function acknowledgeDispatchMessage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await dispatchMessagesService.acknowledgeDispatchMessage({
      id: String(req.params.id),
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

export async function updateDispatchMessage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await dispatchMessagesService.updateDispatchMessage({
      id: String(req.params.id),
      userId: req.user.id,
      role: req.user.role,
      title: typeof req.body?.title === "string" ? req.body.title : undefined,
      body: typeof req.body?.body === "string" ? req.body.body : undefined,
      
      requiresAcknowledgement:
       typeof req.body?.requires_acknowledgement === "boolean" ? req.body.requires_acknowledgement: undefined,
      priority:
        typeof req.body?.priority === "string" ? req.body.priority : undefined,
      isActive:
        typeof req.body?.is_active === "boolean"
          ? req.body.is_active
          : undefined,
      targetScope:
        typeof req.body?.target_scope === "string"
          ? req.body.target_scope
          : undefined,
      targetRole:
        req.body?.target_role === null
          ? null
          : typeof req.body?.target_role === "string"
          ? req.body.target_role
          : undefined,
      targetUserId:
        req.body?.target_user_id === null
          ? null
          : typeof req.body?.target_user_id === "string"
          ? req.body.target_user_id
          : undefined,
      targetWorkOrderId:
        req.body?.target_work_order_id === null
          ? null
          : typeof req.body?.target_work_order_id === "string"
          ? req.body.target_work_order_id
          : undefined,
      targetCompanyId:
        req.body?.target_company_id === null
          ? null
          : typeof req.body?.target_company_id === "string"
          ? req.body.target_company_id
          : undefined,
      messageCategory:
        typeof req.body?.message_category === "string"
          ? req.body.message_category
          : undefined,
      expiresAt:
        req.body?.expires_at === null
          ? null
          : typeof req.body?.expires_at === "string"
          ? req.body.expires_at
          : undefined,
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