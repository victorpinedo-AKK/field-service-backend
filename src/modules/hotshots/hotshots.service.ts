import { JobStatus, Prisma } from "@prisma/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";
import { env } from "../../config/env";
import { r2 } from "../../config/r2";

interface CreateHotshotJobInput {
  userId: string;
  role: string;
  customerFullName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerReferenceNumber?: string;
  pickupName?: string;
  pickupPhone?: string;
  pickupAddress1: string;
  pickupAddress2?: string;
  pickupCity: string;
  pickupState: string;
  pickupPostalCode: string;
  dropoffName?: string;
  dropoffPhone?: string;
  dropoffAddress1: string;
  dropoffAddress2?: string;
  dropoffCity: string;
  dropoffState: string;
  dropoffPostalCode: string;
  urgency?: string;
  priority?: string;
  dispatcherNotes?: string;
  accessNotes?: string;
}

interface ListHotshotJobsInput {
  userId: string;
  role: string;
  status: string;
  search?: string;
}

interface HotshotActionInput {
  jobId: string;
  userId: string;
  role: string;
}

interface DeliverHotshotJobInput {
  jobId: string;
  userId: string;
  role: string;
}

interface GetHotshotJobDetailInput {
  jobId: string;
  userId: string;
  role: string;
}

interface CreateHotshotChecklistItemInput {
  jobId: string;
  userId: string;
  role: string;
  title: string;
  description?: string;
  quantity?: number;
  sortOrder?: number;
}

interface CompleteHotshotChecklistItemInput {
  jobId: string;
  itemId: string;
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

interface UploadHotshotMediaInput {
  jobId: string;
  userId: string;
  role: string;
  fileBuffer: Buffer;
  mimeType: string;
  originalFileName: string;
  fileSizeBytes?: number;
  mediaType?: string;
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

interface DeleteHotshotNoteInput {
  jobId: string;
  noteId: string;
  userId: string;
  role: string;
}

interface DeleteHotshotNoteInput {
  jobId: string;
  noteId: string;
  userId: string;
  role: string;
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

function assertHotshotCreateRole(role: string) {
  if (role !== "admin") {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

async function generateNextHotshotNumber(tx: Prisma.TransactionClient) {
  const latest = await tx.workOrder.findFirst({
    where: {
      division: "hotshots",
      workOrderNumber: {
        startsWith: "HS-",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      workOrderNumber: true,
    },
  });

  if (!latest?.workOrderNumber) {
    return "HS-10001";
  }

  const match = latest.workOrderNumber.match(/^HS-(\d+)$/);

  if (!match) {
    return "HS-10001";
  }

  const nextNumber = Number(match[1]) + 1;
  return `HS-${String(nextNumber).padStart(5, "0")}`;
}

async function logWorkOrderEvent(
  db: Prisma.TransactionClient | typeof prisma,
  params: {
    workOrderId: string;
    eventType: string;
    label: string;
    createdByUserId?: string | null;
    metadata?: Record<string, any>;
  },
) {
  await db.workOrderEvent.create({
    data: {
      workOrderId: params.workOrderId,
      eventType: params.eventType,
      label: params.label,
      createdByUserId: params.createdByUserId ?? null,
      metadata: params.metadata ?? undefined,
    },
  });
}

export async function createHotshotJob(input: CreateHotshotJobInput) {
  assertHotshotCreateRole(input.role);

  if (!input.customerFullName.trim()) {
    throw new AppError("Customer name is required", 400, "INVALID_REQUEST");
  }

  if (!input.pickupAddress1.trim()) {
    throw new AppError("Pickup address is required", 400, "INVALID_REQUEST");
  }

  if (!input.pickupCity.trim()) {
    throw new AppError("Pickup city is required", 400, "INVALID_REQUEST");
  }

  if (!input.pickupState.trim()) {
    throw new AppError("Pickup state is required", 400, "INVALID_REQUEST");
  }

  if (!input.pickupPostalCode.trim()) {
    throw new AppError("Pickup postal code is required", 400, "INVALID_REQUEST");
  }

  if (!input.dropoffAddress1.trim()) {
    throw new AppError("Dropoff address is required", 400, "INVALID_REQUEST");
  }

  if (!input.dropoffCity.trim()) {
    throw new AppError("Dropoff city is required", 400, "INVALID_REQUEST");
  }

  if (!input.dropoffState.trim()) {
    throw new AppError("Dropoff state is required", 400, "INVALID_REQUEST");
  }

  if (!input.dropoffPostalCode.trim()) {
    throw new AppError("Dropoff postal code is required", 400, "INVALID_REQUEST");
  }

  const result = await prisma.$transaction(async (tx) => {
    const workOrderNumber = await generateNextHotshotNumber(tx);

    const customer = await tx.customer.create({
      data: {
        fullName: input.customerFullName.trim(),
        email: input.customerEmail?.trim() || null,
        phone: input.customerPhone?.trim() || null,
      },
    });

    const address = await tx.address.create({
      data: {
        customerId: customer.id,
        line1: input.dropoffAddress1.trim(),
        line2: input.dropoffAddress2?.trim() || null,
        city: input.dropoffCity.trim(),
        state: input.dropoffState.trim(),
        postalCode: input.dropoffPostalCode.trim(),
        country: "US",
        accessNotes: input.accessNotes?.trim() || null,
      },
    });

    const workOrder = await tx.workOrder.create({
      data: {
        workOrderNumber,
        customerReferenceNumber: input.customerReferenceNumber?.trim() || null,
        customerId: customer.id,
        addressId: address.id,
        jobType: "delivery",
        division: "hotshots",
        internalStatus: "ready_to_schedule",
        priority: input.priority?.trim() || "normal",
        dispatcherNotes: input.dispatcherNotes?.trim() || null,
        accessNotes: input.accessNotes?.trim() || null,
      },
    });

    const hotShotDetails = await tx.hotShotDetails.create({
      data: {
        workOrderId: workOrder.id,
        pickupName: input.pickupName?.trim() || null,
        pickupPhone: input.pickupPhone?.trim() || null,
        pickupAddress1: input.pickupAddress1.trim(),
        pickupAddress2: input.pickupAddress2?.trim() || null,
        pickupCity: input.pickupCity.trim(),
        pickupState: input.pickupState.trim(),
        pickupPostalCode: input.pickupPostalCode.trim(),
        dropoffName: input.dropoffName?.trim() || null,
        dropoffPhone: input.dropoffPhone?.trim() || null,
        dropoffAddress1: input.dropoffAddress1.trim(),
        dropoffAddress2: input.dropoffAddress2?.trim() || null,
        dropoffCity: input.dropoffCity.trim(),
        dropoffState: input.dropoffState.trim(),
        dropoffPostalCode: input.dropoffPostalCode.trim(),
        urgency: input.urgency?.trim() || "normal",
      },
    });

    await logWorkOrderEvent(tx as typeof prisma, {
      workOrderId: workOrder.id,
      eventType: "job_created",
      label: "Hotshot Created",
      createdByUserId: input.userId,
      metadata: {
        workOrderNumber,
        customerReferenceNumber: workOrder.customerReferenceNumber,
      },
    });

    return {
      id: workOrder.id,
      work_order_number: workOrder.workOrderNumber,
      customer_reference_number: workOrder.customerReferenceNumber,
      division: workOrder.division,
      internal_status: workOrder.internalStatus,
      priority: workOrder.priority,
      dispatcher_notes: workOrder.dispatcherNotes,
      access_notes: workOrder.accessNotes,
      customer: {
        id: customer.id,
        full_name: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
      pickup: {
        name: hotShotDetails.pickupName,
        phone: hotShotDetails.pickupPhone,
        address_1: hotShotDetails.pickupAddress1,
        address_2: hotShotDetails.pickupAddress2,
        city: hotShotDetails.pickupCity,
        state: hotShotDetails.pickupState,
        postal_code: hotShotDetails.pickupPostalCode,
      },
      dropoff: {
        name: hotShotDetails.dropoffName,
        phone: hotShotDetails.dropoffPhone,
        address_1: hotShotDetails.dropoffAddress1,
        address_2: hotShotDetails.dropoffAddress2,
        city: hotShotDetails.dropoffCity,
        state: hotShotDetails.dropoffState,
        postal_code: hotShotDetails.dropoffPostalCode,
      },
      urgency: hotShotDetails.urgency,
      created_at: workOrder.createdAt,
    };
  });

  return result;
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
  const search = input.search?.trim();

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
      ...(search
        ? {
            OR: [
              {
                workOrderNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                customerReferenceNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                customer: {
                  fullName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                customer: {
                  phone: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
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
    customer_reference_number: job.customerReferenceNumber,
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
    accepted_at: job.hotShotDetails?.acceptedAt ?? null,
    picked_up_at: job.hotShotDetails?.pickedUpAt ?? null,
    delivered_at: job.hotShotDetails?.deliveredAt ?? null,
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
      items: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      notes: {
  orderBy: { createdAt: "desc" },
  include: {
    createdBy: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
  },
},
      media: {
        where: {
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      },
      events: {
        orderBy: { createdAt: "asc" },
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
    customer_reference_number: job.customerReferenceNumber,
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
    items: job.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      quantity: item.quantity,
      sort_order: item.sortOrder,
      status: item.status,
      completed_at: item.completedAt,
      completed_by_user_id: item.completedByUserId,
      created_at: item.createdAt,
    })),
    timeline: job.events.map((event) => ({
      id: event.id,
      event_type: event.eventType,
      label: event.label,
      metadata: event.metadata,
      created_by_user_id: event.createdByUserId,
      created_at: event.createdAt,
    })),
    notes: job.notes.map((note) => ({
  id: note.id,
  note_type: note.noteType,
  body: note.body,
  created_by_user_id: note.createdByUserId,
  created_at: note.createdAt,
  created_by: note.createdBy
    ? {
        id: note.createdBy.id,
        first_name: note.createdBy.firstName,
        last_name: note.createdBy.lastName,
      }
    : null,
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

export async function createHotshotChecklistItem(
  input: CreateHotshotChecklistItemInput,
) {
  assertHotshotRole(input.role);

  if (!["admin", "dispatcher"].includes(input.role)) {
    throw new AppError(
      "Only admin or dispatcher can add checklist items",
      403,
      "FORBIDDEN",
    );
  }

  const title = input.title.trim();

  if (!title) {
    throw new AppError("Checklist item title is required", 400, "INVALID_REQUEST");
  }

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
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

  if (job.internalStatus === JobStatus.completed) {
    throw new AppError(
      "Completed jobs are read-only",
      409,
      "INVALID_STATUS_TRANSITION",
    );
  }

  const item = await prisma.workOrderItem.create({
    data: {
      workOrderId: job.id,
      title,
      description: input.description?.trim() || null,
      quantity:
        typeof input.quantity === "number" && input.quantity > 0
          ? input.quantity
          : null,
      sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : 0,
      createdByUserId: input.userId,
    },
  });

  await logWorkOrderEvent(prisma, {
    workOrderId: job.id,
    eventType: "checklist_item_added",
    label: "Checklist Item Added",
    createdByUserId: input.userId,
    metadata: {
      itemId: item.id,
      title: item.title,
    },
  });

  return {
    id: item.id,
    work_order_id: item.workOrderId,
    work_order_number: job.workOrderNumber,
    title: item.title,
    description: item.description,
    quantity: item.quantity,
    sort_order: item.sortOrder,
    status: item.status,
    completed_at: item.completedAt,
    completed_by_user_id: item.completedByUserId,
    created_at: item.createdAt,
  };
}

export async function completeHotshotChecklistItem(
  input: CompleteHotshotChecklistItemInput,
) {
  assertHotshotRole(input.role);

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);
  const isPrivilegedRole = ["admin", "dispatcher"].includes(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
    },
    select: {
      id: true,
      workOrderNumber: true,
      internalStatus: true,
      assignments: {
        where: {
          userId: input.userId,
          isActive: true,
        },
        select: { id: true },
      },
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  const isAssignedToUser = job.assignments.length > 0;

  if (
    isFieldRole &&
    !isAssignedToUser &&
    job.internalStatus !== JobStatus.ready_to_schedule
  ) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (job.internalStatus === JobStatus.completed && !isPrivilegedRole) {
    throw new AppError(
      "Completed jobs are read-only for non-admin users",
      409,
      "INVALID_STATUS_TRANSITION",
    );
  }

  const item = await prisma.workOrderItem.findFirst({
    where: {
      id: input.itemId,
      workOrderId: job.id,
    },
  });

  if (!item) {
    throw new AppError("Checklist item not found", 404, "ITEM_NOT_FOUND");
  }

  const updated = await prisma.workOrderItem.update({
    where: { id: item.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      completedByUserId: input.userId,
    },
  });

  await logWorkOrderEvent(prisma, {
    workOrderId: job.id,
    eventType: "checklist_item_completed",
    label: "Checklist Item Completed",
    createdByUserId: input.userId,
    metadata: {
      itemId: updated.id,
      title: updated.title,
    },
  });

  return {
    id: updated.id,
    work_order_id: updated.workOrderId,
    work_order_number: job.workOrderNumber,
    title: updated.title,
    status: updated.status,
    completed_at: updated.completedAt,
    completed_by_user_id: updated.completedByUserId,
  };
}

export async function createHotshotNote(input: CreateHotshotNoteInput) {
  assertHotshotRole(input.role);

  const trimmedBody = input.body.trim();

  if (!trimmedBody) {
    throw new AppError("Note body is required", 400, "INVALID_REQUEST");
  }

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);
  const isPrivilegedRole = ["admin", "dispatcher"].includes(input.role);

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

  if (job.internalStatus === JobStatus.completed && !isPrivilegedRole) {
    throw new AppError(
      "Completed jobs are read-only for non-admin users",
      409,
      "INVALID_STATUS_TRANSITION",
    );
  }

  const note = await prisma.workOrderNote.create({
    data: {
      workOrderId: job.id,
      noteType: input.noteType ?? "general",
      body: trimmedBody,
      createdByUserId: input.userId,
    },
  });

  await logWorkOrderEvent(prisma, {
    workOrderId: job.id,
    eventType: "note_added",
    label: "Note Added",
    createdByUserId: input.userId,
    metadata: {
      noteType: note.noteType,
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

export async function deleteHotshotNote(input: {
  jobId: string;
  noteId: string;
  userId: string;
  role: string;
}) {
  assertHotshotRole(input.role);

  if (input.role !== "admin") {
    throw new AppError("Only admins can delete notes", 403, "FORBIDDEN");
  }

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
    },
    select: {
      id: true,
      workOrderNumber: true,
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  const note = await prisma.workOrderNote.findFirst({
    where: {
      id: input.noteId,
      workOrderId: job.id,
    },
  });

  if (!note) {
    throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
  }

  await prisma.workOrderNote.delete({
    where: { id: note.id },
  });

  await logWorkOrderEvent(prisma, {
    workOrderId: job.id,
    eventType: "note_deleted",
    label: "Note Deleted",
    createdByUserId: input.userId,
    metadata: {
      noteId: note.id,
      noteType: note.noteType,
    },
  });

  return {
    id: note.id,
    work_order_id: job.id,
    work_order_number: job.workOrderNumber,
    status: "deleted",
  };
}

export async function uploadHotshotMedia(input: UploadHotshotMediaInput) {
  assertHotshotRole(input.role);

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);
  const isPrivilegedRole = ["admin", "dispatcher"].includes(input.role);

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

  if (job.internalStatus === JobStatus.completed && !isPrivilegedRole) {
    throw new AppError(
      "Completed jobs are read-only for non-admin users",
      409,
      "INVALID_STATUS_TRANSITION",
    );
  }

  const safeFileName = input.originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = `hotshots/${job.workOrderNumber}/${Date.now()}-${safeFileName}`;

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: objectKey,
    Body: input.fileBuffer,
    ContentType: input.mimeType,
  });

  await r2.send(command);

  const media = await prisma.workOrderMedia.create({
    data: {
      workOrderId: job.id,
      mediaType: input.mediaType ?? "photo",
      storageProvider: "cloudflare_r2",
      objectKey,
      bucketName: env.R2_BUCKET,
      mimeType: input.mimeType,
      originalFileName: input.originalFileName,
      fileSizeBytes: input.fileSizeBytes ?? null,
      createdByUserId: input.userId,
    },
  });

  await logWorkOrderEvent(prisma, {
    workOrderId: job.id,
    eventType:
      input.mediaType === "signature" ? "signature_uploaded" : "photo_uploaded",
    label: input.mediaType === "signature" ? "Signature Captured" : "Photo Added",
    createdByUserId: input.userId,
    metadata: {
      mediaId: media.id,
      mediaType: media.mediaType,
      objectKey: media.objectKey,
      fileName: media.originalFileName,
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

export async function createHotshotMediaUploadUrl(
  input: CreateHotshotMediaUploadUrlInput,
) {
  assertHotshotRole(input.role);

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);
  const isPrivilegedRole = ["admin", "dispatcher"].includes(input.role);

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

  if (job.internalStatus === JobStatus.completed && !isPrivilegedRole) {
    throw new AppError(
      "Completed jobs are read-only for non-admin users",
      409,
      "INVALID_STATUS_TRANSITION",
    );
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
  const isPrivilegedRole = ["admin", "dispatcher"].includes(input.role);

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

  if (job.internalStatus === JobStatus.completed && !isPrivilegedRole) {
    throw new AppError(
      "Completed jobs are read-only for non-admin users",
      409,
      "INVALID_STATUS_TRANSITION",
    );
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

  await logWorkOrderEvent(prisma, {
    workOrderId: job.id,
    eventType:
      input.mediaType === "signature" ? "signature_uploaded" : "photo_uploaded",
    label: input.mediaType === "signature" ? "Signature Captured" : "Photo Added",
    createdByUserId: input.userId,
    metadata: {
      mediaId: media.id,
      mediaType: media.mediaType,
      objectKey: media.objectKey,
      fileName: media.originalFileName,
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
  const isPrivilegedRole = ["admin", "dispatcher"].includes(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
    },
    select: {
      id: true,
      workOrderNumber: true,
      internalStatus: true,
      assignments: {
        where: {
          userId: input.userId,
          isActive: true,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  const isAssignedToUser = job.assignments.length > 0;

  if (isFieldRole) {
    const canAccess =
      job.internalStatus === JobStatus.ready_to_schedule || isAssignedToUser;

    if (!canAccess) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
  }

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

  await logWorkOrderEvent(prisma, {
    workOrderId: job.id,
    eventType: "media_deleted",
    label: "Media Deleted",
    createdByUserId: input.userId,
    metadata: {
      mediaId: updated.id,
      mediaType: media.mediaType,
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

    await logWorkOrderEvent(tx as typeof prisma, {
      workOrderId: job.id,
      eventType: "job_accepted",
      label: "Job Accepted",
      createdByUserId: input.userId,
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

    await logWorkOrderEvent(tx as typeof prisma, {
      workOrderId: job.id,
      eventType: "job_released",
      label: "Job Released",
      createdByUserId: input.userId,
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

    await logWorkOrderEvent(tx as typeof prisma, {
      workOrderId: job.id,
      eventType: "job_picked_up",
      label: "Picked Up",
      createdByUserId: input.userId,
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

export async function deliverHotshotJob(input: DeliverHotshotJobInput) {
  assertHotshotRole(input.role);

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
    },
    include: {
      assignments: {
        where: {
          userId: input.userId,
          isActive: true,
        },
      },
      hotShotDetails: true,
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  const isAssignedToUser = job.assignments.length > 0;

  if (isFieldRole && !isAssignedToUser) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (job.internalStatus !== JobStatus.dispatched) {
    throw new AppError(
      "Job must be in dispatched status before delivery",
      409,
      "INVALID_STATUS_TRANSITION",
    );
  }

  const photoCount = await prisma.workOrderMedia.count({
    where: {
      workOrderId: job.id,
      deletedAt: null,
      mediaType: "photo",
    },
  });

  if (photoCount === 0) {
    throw new AppError(
      "At least one delivery photo is required before completing this job",
      409,
      "DELIVERY_PHOTO_REQUIRED",
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

    await logWorkOrderEvent(tx as typeof prisma, {
      workOrderId: job.id,
      eventType: "job_delivered",
      label: "Delivered",
      createdByUserId: input.userId,
    });
  });

  return {
    id: job.id,
    work_order_number: job.workOrderNumber,
    status: JobStatus.completed,
  };
}

export async function deleteHotshotJob(input: {
  jobId: string;
  role: string;
}) {
  if (input.role !== "admin") {
    throw new AppError("Only admins can delete jobs", 403, "FORBIDDEN");
  }

  const existing = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      division: "hotshots",
    },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  await prisma.workOrder.delete({
    where: { id: input.jobId },
  });

  return { success: true };
}