import { JobStatus } from "@prisma/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";
import { env } from "../../config/env";
import { r2 } from "../../config/r2";

interface ListHotshotJobsInput {
  userId: string;
  role: string;
  status: string;
}

interface HotshotActionInput {
  jobId: string;
  userId: string;
  role: string;
}

interface GetHotshotJobDetailInput {
  jobId: string;
  userId: string;
  role: string;
}

interface CreateHotshotNoteInput {
  jobId: string;
  userId: string;
  role: string;
  body: string;
  noteType?: string;
}

interface CreateHotshotMediaUploadUrlInput {
  jobId: string;
  userId: string;
  role: string;
  fileName: string;
  mimeType: string;
}

interface FinalizeHotshotMediaInput {
  jobId: string;
  userId: string;
  role: string;
  objectKey: string;
  mimeType?: string;
  originalFileName?: string;
  fileSizeBytes?: number;
  mediaType?: string;
}

interface SoftDeleteHotshotMediaInput {
  jobId: string;
  mediaId: string;
  userId: string;
  role: string;
}

function assertHotshotRole(role: string) {
  const allowedRoles = ["admin", "dispatcher", "installer", "delivery_lead"];

  if (!allowedRoles.includes(role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

export async function listHotshotJobs(input: ListHotshotJobsInput) {
  assertHotshotRole(input.role);

  const statusMap: Record<string, JobStatus> = {
    available: JobStatus.ready_to_schedule,
    accepted: JobStatus.scheduled,
    active: JobStatus.dispatched,
    delivered: JobStatus.completed,
  };

  const internalStatus = statusMap[input.status] ?? JobStatus.ready_to_schedule;
  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);

  const jobs = await prisma.workOrder.findMany({
    where: {
      division: "hotshots",
      internalStatus,
      ...(isFieldRole && input.status !== "available"
        ? {
            assignments: {
              some: {
                userId: input.userId,
                isActive: true,
              },
            },
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      customer: true,
      hotShotDetails: true,
      assignments: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return jobs.map((job) => ({
    id: job.id,
    work_order_number: job.workOrderNumber,
    division: job.division,
    internal_status: job.internalStatus,
    customer: {
      id: job.customer.id,
      full_name: job.customer.fullName,
      phone: job.customer.phone,
    },
    pickup: job.hotShotDetails
      ? {
          name: job.hotShotDetails.pickupName,
          phone: job.hotShotDetails.pickupPhone,
          address_1: job.hotShotDetails.pickupAddress1,
          city: job.hotShotDetails.pickupCity,
          state: job.hotShotDetails.pickupState,
          postal_code: job.hotShotDetails.pickupPostalCode,
        }
      : null,
    dropoff: job.hotShotDetails
      ? {
          name: job.hotShotDetails.dropoffName,
          phone: job.hotShotDetails.dropoffPhone,
          address_1: job.hotShotDetails.dropoffAddress1,
          city: job.hotShotDetails.dropoffCity,
          state: job.hotShotDetails.dropoffState,
          postal_code: job.hotShotDetails.dropoffPostalCode,
        }
      : null,
    urgency: job.hotShotDetails?.urgency ?? "normal",
    assignee: job.assignments[0]?.user
      ? {
          id: job.assignments[0].user.id,
          first_name: job.assignments[0].user.firstName,
          last_name: job.assignments[0].user.lastName,
        }
      : null,
  }));
}

export async function getHotshotJobDetail(input: GetHotshotJobDetailInput) {
  assertHotshotRole(input.role);

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
      ...(isFieldRole
        ? {
            OR: [
              { internalStatus: JobStatus.ready_to_schedule },
              {
                assignments: {
                  some: {
                    userId: input.userId,
                    isActive: true,
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      customer: true,
      hotShotDetails: true,
      notes: {
        orderBy: { createdAt: "desc" },
      },
      media: {
  where: {
    deletedAt: null,
  },
  orderBy: { createdAt: "desc" },
},
      assignments: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  return {
    id: job.id,
    work_order_number: job.workOrderNumber,
    division: job.division,
    internal_status: job.internalStatus,
    priority: job.priority,
    dispatcher_notes: job.dispatcherNotes,
    access_notes: job.accessNotes,
    customer: {
      id: job.customer.id,
      full_name: job.customer.fullName,
      email: job.customer.email,
      phone: job.customer.phone,
    },
    pickup: job.hotShotDetails
      ? {
          name: job.hotShotDetails.pickupName,
          phone: job.hotShotDetails.pickupPhone,
          address_1: job.hotShotDetails.pickupAddress1,
          address_2: job.hotShotDetails.pickupAddress2,
          city: job.hotShotDetails.pickupCity,
          state: job.hotShotDetails.pickupState,
          postal_code: job.hotShotDetails.pickupPostalCode,
        }
      : null,
    dropoff: job.hotShotDetails
      ? {
          name: job.hotShotDetails.dropoffName,
          phone: job.hotShotDetails.dropoffPhone,
          address_1: job.hotShotDetails.dropoffAddress1,
          address_2: job.hotShotDetails.dropoffAddress2,
          city: job.hotShotDetails.dropoffCity,
          state: job.hotShotDetails.dropoffState,
          postal_code: job.hotShotDetails.dropoffPostalCode,
        }
      : null,
    urgency: job.hotShotDetails?.urgency ?? "normal",
    accepted_at: job.hotShotDetails?.acceptedAt ?? null,
    picked_up_at: job.hotShotDetails?.pickedUpAt ?? null,
    delivered_at: job.hotShotDetails?.deliveredAt ?? null,
    assignee: job.assignments[0]?.user
      ? {
          id: job.assignments[0].user.id,
          first_name: job.assignments[0].user.firstName,
          last_name: job.assignments[0].user.lastName,
          email: job.assignments[0].user.email,
          role: job.assignments[0].user.role,
        }
      : null,
    notes: job.notes.map((note) => ({
      id: note.id,
      note_type: note.noteType,
      body: note.body,
      created_by_user_id: note.createdByUserId,
      created_at: note.createdAt,
    })),
    media: job.media.map((item) => ({
      id: item.id,
      media_type: item.mediaType,
      storage_provider: item.storageProvider,
      object_key: item.objectKey,
      bucket_name: item.bucketName,
      mime_type: item.mimeType,
      original_file_name: item.originalFileName,
      file_size_bytes: item.fileSizeBytes,
      created_by_user_id: item.createdByUserId,
      created_at: item.createdAt,
      url: `${env.R2_PUBLIC_BASE_URL}/${item.objectKey}`,
    })),
  };
}

export async function createHotshotNote(input: CreateHotshotNoteInput) {
  assertHotshotRole(input.role);

  const trimmedBody = input.body.trim();

  if (!trimmedBody) {
    throw new AppError("Note body is required", 400, "INVALID_REQUEST");
  }

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
      ...(isFieldRole
        ? {
            OR: [
              { internalStatus: JobStatus.ready_to_schedule },
              {
                assignments: {
                  some: {
                    userId: input.userId,
                    isActive: true,
                  },
                },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      workOrderNumber: true,
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  const note = await prisma.workOrderNote.create({
    data: {
      workOrderId: job.id,
      noteType: input.noteType ?? "general",
      body: trimmedBody,
      createdByUserId: input.userId,
    },
  });

  return {
    id: note.id,
    work_order_id: note.workOrderId,
    work_order_number: job.workOrderNumber,
    note_type: note.noteType,
    body: note.body,
    created_by_user_id: note.createdByUserId,
    created_at: note.createdAt,
  };
}

export async function createHotshotMediaUploadUrl(
  input: CreateHotshotMediaUploadUrlInput,
) {
  assertHotshotRole(input.role);

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
      ...(isFieldRole
        ? {
            OR: [
              { internalStatus: JobStatus.ready_to_schedule },
              {
                assignments: {
                  some: {
                    userId: input.userId,
                    isActive: true,
                  },
                },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      workOrderNumber: true,
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = `hotshots/${job.workOrderNumber}/${Date.now()}-${safeFileName}`;

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: objectKey,
    ContentType: input.mimeType,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

  return {
    upload_url: uploadUrl,
    object_key: objectKey,
    bucket_name: env.R2_BUCKET,
    public_url: `${env.R2_PUBLIC_BASE_URL}/${objectKey}`,
  };
}

export async function finalizeHotshotMedia(input: FinalizeHotshotMediaInput) {
  assertHotshotRole(input.role);

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
      ...(isFieldRole
        ? {
            OR: [
              { internalStatus: JobStatus.ready_to_schedule },
              {
                assignments: {
                  some: {
                    userId: input.userId,
                    isActive: true,
                  },
                },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      workOrderNumber: true,
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  const media = await prisma.workOrderMedia.create({
    data: {
      workOrderId: job.id,
      mediaType: input.mediaType ?? "photo",
      storageProvider: "cloudflare_r2",
      objectKey: input.objectKey,
      bucketName: env.R2_BUCKET,
      mimeType: input.mimeType ?? null,
      originalFileName: input.originalFileName ?? null,
      fileSizeBytes: input.fileSizeBytes ?? null,
      createdByUserId: input.userId,
    },
  });

  return {
    id: media.id,
    work_order_id: media.workOrderId,
    work_order_number: job.workOrderNumber,
    media_type: media.mediaType,
    object_key: media.objectKey,
    bucket_name: media.bucketName,
    mime_type: media.mimeType,
    original_file_name: media.originalFileName,
    file_size_bytes: media.fileSizeBytes,
    created_at: media.createdAt,
    url: `${env.R2_PUBLIC_BASE_URL}/${media.objectKey}`,
  };
}

export async function softDeleteHotshotMedia(
  input: SoftDeleteHotshotMediaInput,
) {
  assertHotshotRole(input.role);

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
      ...(isFieldRole
        ? {
            OR: [
              { internalStatus: JobStatus.ready_to_schedule },
              {
                assignments: {
                  some: {
                    userId: input.userId,
                    isActive: true,
                  },
                },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      workOrderNumber: true,
      internalStatus: true,
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  const isPrivilegedRole = ["admin", "dispatcher"].includes(input.role);

if (job.internalStatus === JobStatus.completed && !isPrivilegedRole) {
  throw new AppError(
    "Only admin or dispatcher can delete media after delivery is completed",
    409,
    "INVALID_STATUS_TRANSITION",
  );
}

  const media = await prisma.workOrderMedia.findFirst({
    where: {
      id: input.mediaId,
      workOrderId: job.id,
      deletedAt: null,
    },
  });

  if (!media) {
    throw new AppError("Media not found", 404, "MEDIA_NOT_FOUND");
  }

  const updated = await prisma.workOrderMedia.update({
    where: { id: media.id },
    data: {
      deletedAt: new Date(),
      deletedByUserId: input.userId,
    },
  });

  return {
    id: updated.id,
    work_order_id: updated.workOrderId,
    work_order_number: job.workOrderNumber,
    status: "deleted",
    deleted_at: updated.deletedAt,
    deleted_by_user_id: updated.deletedByUserId,
  };
}

export async function acceptHotshotJob(input: HotshotActionInput) {
  assertHotshotRole(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
    },
    include: {
      hotShotDetails: true,
      assignments: {
        where: { isActive: true },
      },
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  if (job.internalStatus !== JobStatus.ready_to_schedule) {
    throw new AppError(
      "Job is not available to accept",
      409,
      "INVALID_STATUS_TRANSITION",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id: job.id },
      data: {
        internalStatus: JobStatus.scheduled,
      },
    });

    await tx.workOrderAssignment.updateMany({
      where: {
        workOrderId: job.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    await tx.workOrderAssignment.create({
      data: {
        workOrderId: job.id,
        userId: input.userId,
        assignmentType: "primary",
        isActive: true,
      },
    });

    if (job.hotShotDetails) {
      await tx.hotShotDetails.update({
        where: { workOrderId: job.id },
        data: {
          acceptedAt: new Date(),
        },
      });
    }
  });

  return {
    id: job.id,
    work_order_number: job.workOrderNumber,
    status: "accepted",
  };
}

export async function releaseHotshotJob(input: HotshotActionInput) {
  assertHotshotRole(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
      assignments: {
        some: {
          userId: input.userId,
          isActive: true,
        },
      },
    },
    include: {
      hotShotDetails: true,
      assignments: {
        where: {
          userId: input.userId,
          isActive: true,
        },
      },
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  if (job.internalStatus !== JobStatus.scheduled) {
    throw new AppError(
      "Only accepted jobs can be released",
      409,
      "INVALID_STATUS_TRANSITION",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id: job.id },
      data: {
        internalStatus: JobStatus.ready_to_schedule,
      },
    });

    await tx.workOrderAssignment.updateMany({
      where: {
        workOrderId: job.id,
        userId: input.userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    if (job.hotShotDetails) {
      await tx.hotShotDetails.update({
        where: { workOrderId: job.id },
        data: {
          acceptedAt: null,
        },
      });
    }
  });

  return {
    id: job.id,
    work_order_number: job.workOrderNumber,
    status: "released",
  };
}

export async function pickupHotshotJob(input: HotshotActionInput) {
  assertHotshotRole(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
      assignments: {
        some: {
          userId: input.userId,
          isActive: true,
        },
      },
    },
    include: {
      hotShotDetails: true,
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  if (job.internalStatus !== JobStatus.scheduled) {
    throw new AppError(
      "Job cannot be picked up from current status",
      409,
      "INVALID_STATUS_TRANSITION",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id: job.id },
      data: {
        internalStatus: JobStatus.dispatched,
      },
    });

    if (job.hotShotDetails) {
      await tx.hotShotDetails.update({
        where: { workOrderId: job.id },
        data: {
          pickedUpAt: new Date(),
        },
      });
    }
  });

  return {
    id: job.id,
    work_order_number: job.workOrderNumber,
    status: "picked_up",
  };
}

export async function deliverHotshotJob(input: HotshotActionInput) {
  assertHotshotRole(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
      assignments: {
        some: {
          userId: input.userId,
          isActive: true,
        },
      },
    },
    include: {
      hotShotDetails: true,
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  if (job.internalStatus !== JobStatus.dispatched) {
    throw new AppError(
      "Job cannot be delivered from current status",
      409,
      "INVALID_STATUS_TRANSITION",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id: job.id },
      data: {
        internalStatus: JobStatus.completed,
      },
    });

    if (job.hotShotDetails) {
      await tx.hotShotDetails.update({
        where: { workOrderId: job.id },
        data: {
          deliveredAt: new Date(),
        },
      });
    }
  });

  return {
    id: job.id,
    work_order_number: job.workOrderNumber,
    status: "delivered",
  };
}