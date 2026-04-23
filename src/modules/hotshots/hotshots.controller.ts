import type { Response, NextFunction } from "express";
import { AppError } from "../../common/errors/AppError";
import type { AuthenticatedRequest } from "../../common/middleware/authMiddleware";
import * as hotshotsService from "./hotshots.service";

export async function createHotshotJob(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.createHotshotJob({
      userId: req.user.id,
      role: req.user.role,
      customerFullName:
        typeof req.body?.customer_full_name === "string"
          ? req.body.customer_full_name
          : "",
      customerEmail:
        typeof req.body?.customer_email === "string"
          ? req.body.customer_email
          : undefined,
      customerPhone:
        typeof req.body?.customer_phone === "string"
          ? req.body.customer_phone
          : undefined,
      customerReferenceNumber:
        typeof req.body?.customer_reference_number === "string"
          ? req.body.customer_reference_number
          : undefined,
      pickupName:
        typeof req.body?.pickup_name === "string"
          ? req.body.pickup_name
          : undefined,
      pickupPhone:
        typeof req.body?.pickup_phone === "string"
          ? req.body.pickup_phone
          : undefined,
      pickupAddress1:
        typeof req.body?.pickup_address_1 === "string"
          ? req.body.pickup_address_1
          : "",
      pickupAddress2:
        typeof req.body?.pickup_address_2 === "string"
          ? req.body.pickup_address_2
          : undefined,
      pickupCity:
        typeof req.body?.pickup_city === "string"
          ? req.body.pickup_city
          : "",
      pickupState:
        typeof req.body?.pickup_state === "string"
          ? req.body.pickup_state
          : "",
      pickupPostalCode:
        typeof req.body?.pickup_postal_code === "string"
          ? req.body.pickup_postal_code
          : "",
      dropoffName:
        typeof req.body?.dropoff_name === "string"
          ? req.body.dropoff_name
          : undefined,
      dropoffPhone:
        typeof req.body?.dropoff_phone === "string"
          ? req.body.dropoff_phone
          : undefined,
      dropoffAddress1:
        typeof req.body?.dropoff_address_1 === "string"
          ? req.body.dropoff_address_1
          : "",
      dropoffAddress2:
        typeof req.body?.dropoff_address_2 === "string"
          ? req.body.dropoff_address_2
          : undefined,
      dropoffCity:
        typeof req.body?.dropoff_city === "string"
          ? req.body.dropoff_city
          : "",
      dropoffState:
        typeof req.body?.dropoff_state === "string"
          ? req.body.dropoff_state
          : "",
      dropoffPostalCode:
        typeof req.body?.dropoff_postal_code === "string"
          ? req.body.dropoff_postal_code
          : "",
      urgency:
        typeof req.body?.urgency === "string"
          ? req.body.urgency
          : undefined,
      priority:
        typeof req.body?.priority === "string"
          ? req.body.priority
          : undefined,
      dispatcherNotes:
        typeof req.body?.dispatcher_notes === "string"
          ? req.body.dispatcher_notes
          : undefined,
      accessNotes:
        typeof req.body?.access_notes === "string"
          ? req.body.access_notes
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
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
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

export async function createHotshotChecklistItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.createHotshotChecklistItem({
      jobId: String(req.params.id),
      userId: req.user.id,
      role: req.user.role,
      title: typeof req.body?.title === "string" ? req.body.title : "",
      description:
        typeof req.body?.description === "string"
          ? req.body.description
          : undefined,
      quantity:
        typeof req.body?.quantity === "number" ? req.body.quantity : undefined,
      sortOrder:
        typeof req.body?.sort_order === "number"
          ? req.body.sort_order
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

export async function completeHotshotChecklistItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.completeHotshotChecklistItem({
      jobId: String(req.params.id),
      itemId: String(req.params.itemId),
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

    if (req.user.role !== "admin") {
      throw new AppError("Only admins can delete media", 403, "FORBIDDEN");
    }

    const result = await hotshotsService.softDeleteHotshotMedia({
      jobId: String(req.params.jobId || req.params.id),
      mediaId: String(req.params.mediaId),
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

export async function deleteHotshotJob(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const result = await hotshotsService.deleteHotshotJob({
      jobId: String(req.params.id),
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

export async function deleteHotshotNote(req: any, res: any, next: any) {
  try {
    const result = await hotshotsService.deleteHotshotNote({
      jobId: String(req.params.id),
      noteId: String(req.params.noteId),
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