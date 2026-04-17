import type { Response, NextFunction } from "express";
import { AppError } from "../../common/errors/AppError";
import type { AuthenticatedRequest } from "../../common/middleware/authMiddleware";
import * as hotshotsService from "./hotshots.service";

export async function listHotshotJobs(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const status =
      typeof req.query.status === "string" ? req.query.status : "available";

    const result = await hotshotsService.listHotshotJobs({
      userId: req.user.id,
      role: req.user.role,
      status,
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

export async function getHotshotJobDetail(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.getHotshotJobDetail({
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

export async function createHotshotNote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.createHotshotNote({
      jobId: String(req.params.id),
      userId: req.user.id,
      role: req.user.role,
      body: typeof req.body?.body === "string" ? req.body.body : "",
      noteType:
        typeof req.body?.note_type === "string" ? req.body.note_type : "general",
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

export async function createHotshotMediaUploadUrl(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.createHotshotMediaUploadUrl({
      jobId: String(req.params.id),
      userId: req.user.id,
      role: req.user.role,
      fileName:
        typeof req.body?.file_name === "string"
          ? req.body.file_name
          : "photo.jpg",
      mimeType:
        typeof req.body?.mime_type === "string"
          ? req.body.mime_type
          : "image/jpeg",
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

export async function uploadHotshotMedia(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!req.file) {
      throw new AppError("File is required", 400, "INVALID_REQUEST");
    }

    const result = await hotshotsService.uploadHotshotMedia({
      jobId: String(req.params.id),
      userId: req.user.id,
      role: req.user.role,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalFileName: req.file.originalname,
      fileSizeBytes: req.file.size,
      mediaType:
        typeof req.body?.media_type === "string" ? req.body.media_type : "photo",
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

export async function finalizeHotshotMedia(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.finalizeHotshotMedia({
      jobId: String(req.params.id),
      userId: req.user.id,
      role: req.user.role,
      objectKey:
        typeof req.body?.object_key === "string" ? req.body.object_key : "",
      mimeType:
        typeof req.body?.mime_type === "string" ? req.body.mime_type : undefined,
      originalFileName:
        typeof req.body?.original_file_name === "string"
          ? req.body.original_file_name
          : undefined,
      fileSizeBytes:
        typeof req.body?.file_size_bytes === "number"
          ? req.body.file_size_bytes
          : undefined,
      mediaType:
        typeof req.body?.media_type === "string" ? req.body.media_type : "photo",
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

export async function softDeleteHotshotMedia(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const jobId = req.params.jobId || req.params.id;
    const mediaId = req.params.mediaId;

    const result = await hotshotsService.softDeleteHotshotMedia({
      jobId: String(jobId),
      mediaId: String(mediaId),
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

export async function acceptHotshotJob(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.acceptHotshotJob({
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

export async function releaseHotshotJob(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.releaseHotshotJob({
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

export async function pickupHotshotJob(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.pickupHotshotJob({
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

export async function deliverHotshotJob(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.deliverHotshotJob({
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