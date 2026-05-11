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
      latitude: typeof req.body?.latitude === "number" ? req.body.latitude : null,
      longitude: typeof req.body?.longitude === "number" ? req.body.longitude : null,
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
      latitude: typeof req.body?.latitude === "number" ? req.body.latitude : null,
      longitude: typeof req.body?.longitude === "number" ? req.body.longitude : null,
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

export async function getLiveConstructionCrew(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.getLiveConstructionCrew({
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

export async function createConstructionNote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.createConstructionNote({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
      body: String(req.body?.body || ""),
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

export async function uploadConstructionMedia(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    if (!req.file) {
      throw new AppError("File is required", 400, "INVALID_REQUEST");
    }

    const result = await constructionService.uploadConstructionMedia({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalFileName: req.file.originalname,
      fileSizeBytes: req.file.size,
      mediaType: typeof req.body?.media_type === "string" ? req.body.media_type : "photo",
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

export async function getConstructionActivityFeed(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.getConstructionActivityFeed({
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

export async function deleteConstructionNote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.deleteConstructionNote({
      noteId: String(req.params.noteId),
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

export async function deleteConstructionMedia(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.deleteConstructionMedia({
      mediaId: String(req.params.mediaId),
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

export async function getMissedClockOuts(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.getMissedClockOuts({
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

export async function listConstructionCrew(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.listConstructionCrew({
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

export async function assignCrewToSite(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.assignCrewToSite({
      siteId: String(req.params.id),
      assignedUserId: String(req.body?.user_id || ""),
      assignmentType: typeof req.body?.assignment_type === "string" ? req.body.assignment_type : "crew",
      userId: user.id,
      role: user.role,
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

export async function removeCrewFromSite(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.removeCrewFromSite({
      siteId: String(req.params.id),
      assignmentId: String(req.params.assignmentId),
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

export async function listConstructionProjects(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.listConstructionProjects({
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

export async function createConstructionProject(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.createConstructionProject({
      userId: user.id,
      role: user.role,
      customerName: String(req.body?.customer_name || ""),
      projectName: String(req.body?.project_name || ""),
      projectType: String(req.body?.project_type || "custom_project"),
      trades: Array.isArray(req.body?.trades) ? req.body.trades.map(String) : [],
      addressLine1: String(req.body?.address_line1 || ""),
      city: String(req.body?.city || ""),
      state: String(req.body?.state || ""),
      postalCode: String(req.body?.postal_code || ""),
      dispatcherNotes: String(req.body?.dispatcher_notes || ""),
      scheduledStartAt: typeof req.body?.scheduled_start_at === "string" ? req.body.scheduled_start_at : null,
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

export async function deleteConstructionProject(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.deleteConstructionProject({
      projectId: String(req.params.id),
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

export async function updateConstructionProjectStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.updateConstructionProjectStatus({
      projectId: String(req.params.id),
      userId: user.id,
      role: user.role,
      status: String(req.body?.status || ""),
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

export async function listConstructionTasks(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.listConstructionTasks({
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

export async function createConstructionTask(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.createConstructionTask({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
      title: String(req.body?.title || ""),
      trade: String(req.body?.trade || ""),
      assignedToUserId: typeof req.body?.assigned_to_user_id === "string" ? req.body.assigned_to_user_id : null,
      dueDate: typeof req.body?.due_date === "string" ? req.body.due_date : null,
      notes: String(req.body?.notes || ""),
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

export async function updateConstructionTask(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.updateConstructionTask({
      taskId: String(req.params.taskId),
      userId: user.id,
      role: user.role,
      status: typeof req.body?.status === "string" ? req.body.status : undefined,
      title: typeof req.body?.title === "string" ? req.body.title : undefined,
      trade: typeof req.body?.trade === "string" ? req.body.trade : undefined,
      notes: typeof req.body?.notes === "string" ? req.body.notes : undefined,
      assignedToUserId: typeof req.body?.assigned_to_user_id === "string" ? req.body.assigned_to_user_id : undefined,
      dueDate: typeof req.body?.due_date === "string" ? req.body.due_date : undefined,
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

export async function deleteConstructionTask(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.deleteConstructionTask({
      taskId: String(req.params.taskId),
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

export async function getConstructionProjectProgress(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.getConstructionProjectProgress({
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

export async function getConstructionCrewAvailability(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.getConstructionCrewAvailability({
      userId: user.id,
      role: user.role,
      date: typeof req.query?.date === "string" ? req.query.date : "",
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

export async function getConstructionDailyReportV2(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.getConstructionDailyReportV2({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
      date: typeof req.query?.date === "string" ? req.query.date : undefined,
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

export async function saveConstructionDailyReport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.saveConstructionDailyReport({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
      date: String(req.body?.date || ""),
      workCompleted: String(req.body?.work_completed || ""),
      blockers: String(req.body?.blockers || ""),
      materialsUsed: String(req.body?.materials_used || ""),
      safetyNotes: String(req.body?.safety_notes || ""),
      weatherNotes: String(req.body?.weather_notes || ""),
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

export async function submitConstructionDailyReport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.submitConstructionDailyReport({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
      date: String(req.body?.date || ""),
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

export async function getConstructionTaskDetail(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.getConstructionTaskDetail({
      taskId: String(req.params.taskId),
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

export async function createConstructionTaskNote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.createConstructionTaskNote({
      taskId: String(req.params.taskId),
      userId: user.id,
      role: user.role,
      body: String(req.body?.body || ""),
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

export async function uploadConstructionTaskMedia(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    if (!req.file) {
      throw new AppError("File is required", 400, "INVALID_REQUEST");
    }

    const result = await constructionService.uploadConstructionTaskMedia({
      taskId: String(req.params.taskId),
      userId: user.id,
      role: user.role,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalFileName: req.file.originalname,
      fileSizeBytes: req.file.size,
      mediaType: typeof req.body?.media_type === "string" ? req.body.media_type : "photo",
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

export async function listConstructionPunchItems(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.listConstructionPunchItems({
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

export async function createConstructionPunchItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.createConstructionPunchItem({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
      title: String(req.body?.title || ""),
      trade: typeof req.body?.trade === "string" ? req.body.trade : null,
      priority: typeof req.body?.priority === "string" ? req.body.priority : "normal",
      assignedToUserId: typeof req.body?.assigned_to_user_id === "string" ? req.body.assigned_to_user_id : null,
      notes: String(req.body?.notes || ""),
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

export async function updateConstructionPunchItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.updateConstructionPunchItem({
      punchItemId: String(req.params.punchItemId),
      userId: user.id,
      role: user.role,
      title: typeof req.body?.title === "string" ? req.body.title : undefined,
      trade: typeof req.body?.trade === "string" ? req.body.trade : undefined,
      priority: typeof req.body?.priority === "string" ? req.body.priority : undefined,
      status: typeof req.body?.status === "string" ? req.body.status : undefined,
      assignedToUserId: typeof req.body?.assigned_to_user_id === "string" ? req.body.assigned_to_user_id : undefined,
      notes: typeof req.body?.notes === "string" ? req.body.notes : undefined,
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

export async function deleteConstructionPunchItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.deleteConstructionPunchItem({
      punchItemId: String(req.params.punchItemId),
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

export async function updateConstructionProjectSchedule(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.updateConstructionProjectSchedule({
      projectId: String(req.params.id),
      userId: user.id,
      role: user.role,
      scheduledStartAt:
        typeof req.body?.scheduled_start_at === "string"
          ? req.body.scheduled_start_at
          : null,
      scheduledEndAt:
        typeof req.body?.scheduled_end_at === "string"
          ? req.body.scheduled_end_at
          : null,
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

export async function listConstructionDailyReports(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.listConstructionDailyReports({
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

export async function listConstructionInspections(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.listConstructionInspections({
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

export async function createConstructionInspection(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.createConstructionInspection({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
      inspectionType:
        typeof req.body?.inspection_type === "string"
          ? req.body.inspection_type
          : "final_walkthrough",
      notes: String(req.body?.notes || ""),
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

export async function updateConstructionInspection(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.updateConstructionInspection({
      inspectionId: String(req.params.inspectionId),
      userId: user.id,
      role: user.role,
      status:
        typeof req.body?.status === "string" ? req.body.status : undefined,
      result:
        typeof req.body?.result === "string" ? req.body.result : undefined,
      notes:
        typeof req.body?.notes === "string" ? req.body.notes : undefined,
      failedReason:
        typeof req.body?.failed_reason === "string"
          ? req.body.failed_reason
          : undefined,
      createPunchItem:
        typeof req.body?.create_punch_item === "boolean"
          ? req.body.create_punch_item
          : false,
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

export async function getConstructionCloseoutStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.getConstructionCloseoutStatus({
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

export async function completeConstructionProject(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.completeConstructionProject({
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

export async function listConstructionCustomerSignoffs(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.listConstructionCustomerSignoffs({
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

export async function createConstructionCustomerSignoff(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.createConstructionCustomerSignoff({
      siteId: String(req.params.id),
      userId: user.id,
      role: user.role,
      customerName: String(req.body?.customer_name || ""),
      customerEmail:
        typeof req.body?.customer_email === "string"
          ? req.body.customer_email
          : undefined,
      agreedWorkSummary: String(req.body?.agreed_work_summary || ""),
      customerNotes:
        typeof req.body?.customer_notes === "string"
          ? req.body.customer_notes
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

export async function updateConstructionCustomerSignoffSignature(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result =
      await constructionService.updateConstructionCustomerSignoffSignature({
        signoffId: String(req.params.signoffId),
        userId: user.id,
        role: user.role,
        signatureImageUrl: String(req.body?.signature_image_url || ""),
        signatureImageKey:
          typeof req.body?.signature_image_key === "string"
            ? req.body.signature_image_key
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

export async function updateConstructionCustomerSignoffPdf(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = requireUser(req);

    const result = await constructionService.updateConstructionCustomerSignoffPdf({
      signoffId: String(req.params.signoffId),
      userId: user.id,
      role: user.role,
      pdfUrl: String(req.body?.pdf_url || ""),
      pdfKey:
        typeof req.body?.pdf_key === "string" ? req.body.pdf_key : undefined,
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