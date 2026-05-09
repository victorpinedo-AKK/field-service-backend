import { JobStatus } from "@prisma/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";
import { env } from "../../config/env";
import { r2 } from "../../config/r2";

type RoleInput = {
  userId: string;
  role: string;
};

type SiteInput = RoleInput & {
  siteId: string;
};

type ClockInput = SiteInput & {
  latitude: number | null;
  longitude: number | null;
};

const allowedRoles = ["admin", "dispatcher", "installer", "delivery_lead", "operations"];

const adminConstructionRoles = ["admin", "operations", "dispatcher"];

const activeConstructionStatuses = [
  JobStatus.new,
  JobStatus.ready_to_schedule,
  JobStatus.scheduled,
  JobStatus.dispatched,
  JobStatus.on_site,
  JobStatus.follow_up_required,
];

function assertConstructionRole(role: string) {
  if (!allowedRoles.includes(role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function assertAdminConstructionRole(role: string) {
  if (!adminConstructionRoles.includes(role)) {
    throw new AppError(
      "Only admin, operations, or dispatcher can manage this construction resource.",
      403,
      "FORBIDDEN",
    );
  }
}

function isAdminConstructionRole(role: string) {
  return adminConstructionRoles.includes(role);
}

function isFieldRole(role: string) {
  return ["installer", "delivery_lead"].includes(role);
}

function extractProjectType(accessNotes?: string | null) {
  if (!accessNotes) return null;

  const line = accessNotes
    .split("\n")
    .find((item) => item.toLowerCase().startsWith("project type:"));

  return line ? line.replace("Project Type:", "").trim() : null;
}

function extractTrades(accessNotes?: string | null) {
  if (!accessNotes) return [];

  const line = accessNotes
    .split("\n")
    .find((item) => item.toLowerCase().startsWith("trades:"));

  if (!line) return [];

  return line
    .replace("Trades:", "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapTimeEntry(entry: any) {
  if (!entry) return null;

  return {
    id: entry.id,
    work_order_id: entry.workOrderId,
    user_id: entry.userId,
    clock_in_at: entry.clockInAt,
    clock_out_at: entry.clockOutAt,
    clock_in_lat: entry.clockInLat,
    clock_in_lng: entry.clockInLng,
    clock_out_lat: entry.clockOutLat,
    clock_out_lng: entry.clockOutLng,
    created_at: entry.createdAt,
  };
}

function mapSite(site: any, currentEntry?: any) {
  return {
    id: site.id,
    work_order_number: site.workOrderNumber,
    customer_reference_number: site.customerReferenceNumber,
    division: site.division,
    internal_status: site.internalStatus,
    priority: site.priority,
    scheduled_start_at: site.scheduledStartAt,
    scheduled_end_at: site.scheduledEndAt,
    dispatcher_notes: site.dispatcherNotes,
    access_notes: site.accessNotes,
    project_type: extractProjectType(site.accessNotes),
    trades: extractTrades(site.accessNotes),
    customer: site.customer
      ? {
          id: site.customer.id,
          full_name: site.customer.fullName,
          phone: site.customer.phone,
          email: site.customer.email,
        }
      : null,
    address: site.address
      ? {
          id: site.address.id,
          line1: site.address.line1,
          line2: site.address.line2,
          city: site.address.city,
          state: site.address.state,
          postal_code: site.address.postalCode,
          country: site.address.country,
          access_notes: site.address.accessNotes,
        }
      : null,
    assignments: (site.assignments || []).map((assignment: any) => ({
      id: assignment.id,
      assignment_type: assignment.assignmentType,
      assigned_at: assignment.assignedAt,
      user: assignment.user
        ? {
            id: assignment.user.id,
            first_name: assignment.user.firstName,
            last_name: assignment.user.lastName,
            email: assignment.user.email,
            role: assignment.user.role,
          }
        : null,
    })),
    assignee: site.assignments?.[0]?.user
      ? {
          id: site.assignments[0].user.id,
          first_name: site.assignments[0].user.firstName,
          last_name: site.assignments[0].user.lastName,
          email: site.assignments[0].user.email,
          role: site.assignments[0].user.role,
        }
      : null,
    current_time_entry: currentEntry ? mapTimeEntry(currentEntry) : null,
  };
}

function mapConstructionTask(task: any) {
  return {
    id: task.id,
    work_order_id: task.workOrderId,
    title: task.title,
    trade: task.trade,
    status: task.status,
    due_date: task.dueDate,
    notes: task.notes,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    assigned_to: task.assignedTo
      ? {
          id: task.assignedTo.id,
          first_name: task.assignedTo.firstName,
          last_name: task.assignedTo.lastName,
          role: task.assignedTo.role,
          email: task.assignedTo.email,
        }
      : null,
  };
}

function mapConstructionTaskNote(note: any) {
  return {
    id: note.id,
    task_id: note.taskId,
    body: note.body,
    created_at: note.createdAt,
    created_by: note.createdBy
      ? {
          id: note.createdBy.id,
          first_name: note.createdBy.firstName,
          last_name: note.createdBy.lastName,
          role: note.createdBy.role,
        }
      : null,
  };
}

function mapConstructionTaskMedia(media: any) {
  return {
    id: media.id,
    task_id: media.taskId,
    media_type: media.mediaType,
    object_key: media.objectKey,
    url: `${env.R2_PUBLIC_BASE_URL}/${media.objectKey}`,
    created_at: media.createdAt,
  };
}

function mapDailyReport(report: any) {
  if (!report) return null;

  return {
    id: report.id,
    work_order_id: report.workOrderId,
    report_date: report.reportDate,
    work_completed: report.workCompleted,
    blockers: report.blockers,
    materials_used: report.materialsUsed,
    safety_notes: report.safetyNotes,
    weather_notes: report.weatherNotes,
    submitted_at: report.submittedAt,
    submitted_by: report.submittedBy
      ? {
          id: report.submittedBy.id,
          first_name: report.submittedBy.firstName,
          last_name: report.submittedBy.lastName,
          role: report.submittedBy.role,
        }
      : null,
    created_at: report.createdAt,
    updated_at: report.updatedAt,
  };
}

function mapConstructionPunchItem(item: any) {
  return {
    id: item.id,
    work_order_id: item.workOrderId,
    title: item.title,
    trade: item.trade,
    priority: item.priority,
    status: item.status,
    notes: item.notes,
    completed_at: item.completedAt,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    assigned_to: item.assignedTo
      ? {
          id: item.assignedTo.id,
          first_name: item.assignedTo.firstName,
          last_name: item.assignedTo.lastName,
          role: item.assignedTo.role,
          email: item.assignedTo.email,
        }
      : null,
    created_by: item.createdBy
      ? {
          id: item.createdBy.id,
          first_name: item.createdBy.firstName,
          last_name: item.createdBy.lastName,
          role: item.createdBy.role,
        }
      : null,
  };
}

function getReportDayRange(date?: string) {
  const selected = date ? new Date(`${date}T12:00:00.000Z`) : new Date();

  if (Number.isNaN(selected.getTime())) {
    throw new AppError("Invalid report date.", 400, "INVALID_DATE");
  }

  const start = new Date(selected);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(selected);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end, dateKey: start.toISOString().slice(0, 10) };
}

export async function getLiveConstructionCrew(input: RoleInput) {
  assertConstructionRole(input.role);

  if (!isAdminConstructionRole(input.role)) {
    throw new AppError(
      "Only admin, dispatcher, or operations can view live crew.",
      403,
      "FORBIDDEN",
    );
  }

  const entries = await prisma.constructionTimeEntry.findMany({
    where: {
      clockOutAt: null,
    },
    orderBy: {
      clockInAt: "asc",
    },
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
      workOrder: {
        include: {
          customer: true,
          address: true,
        },
      },
    },
  });

  const now = Date.now();

  return entries.map((entry) => {
    const durationMinutes = Math.max(
      0,
      Math.floor((now - entry.clockInAt.getTime()) / 60000),
    );

    return {
      id: entry.id,
      clock_in_at: entry.clockInAt,
      clock_in_lat: entry.clockInLat,
      clock_in_lng: entry.clockInLng,
      duration_minutes: durationMinutes,
      user: {
        id: entry.user.id,
        first_name: entry.user.firstName,
        last_name: entry.user.lastName,
        email: entry.user.email,
        role: entry.user.role,
      },
      site: {
        id: entry.workOrder.id,
        work_order_number: entry.workOrder.workOrderNumber,
        customer_reference_number: entry.workOrder.customerReferenceNumber,
        internal_status: entry.workOrder.internalStatus,
        customer: {
          id: entry.workOrder.customer.id,
          full_name: entry.workOrder.customer.fullName,
          phone: entry.workOrder.customer.phone,
          email: entry.workOrder.customer.email,
        },
        address: {
          id: entry.workOrder.address.id,
          line1: entry.workOrder.address.line1,
          line2: entry.workOrder.address.line2,
          city: entry.workOrder.address.city,
          state: entry.workOrder.address.state,
          postal_code: entry.workOrder.address.postalCode,
          country: entry.workOrder.address.country,
        },
      },
    };
  });
}

export async function listConstructionSites(input: RoleInput) {
  assertConstructionRole(input.role);

  const fieldRole = isFieldRole(input.role);

  const sites = await prisma.workOrder.findMany({
    where: {
      division: "construction",
      internalStatus: {
        in: activeConstructionStatuses,
      },
      ...(fieldRole
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
    orderBy: [{ scheduledStartAt: "asc" }, { createdAt: "desc" }],
    include: {
      customer: true,
      address: true,
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

  const openEntries = await prisma.constructionTimeEntry.findMany({
    where: {
      userId: input.userId,
      clockOutAt: null,
    },
  });

  const openEntryBySiteId = new Map(
    openEntries.map((entry) => [entry.workOrderId, entry]),
  );

  return sites.map((site) => mapSite(site, openEntryBySiteId.get(site.id)));
}

export async function getConstructionSiteDetail(input: SiteInput) {
  assertConstructionRole(input.role);

  const fieldRole = isFieldRole(input.role);

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(fieldRole
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
    include: {
      customer: true,
      address: true,
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

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  return mapSite(site);
}

export async function getCurrentTimeEntry(input: SiteInput) {
  assertConstructionRole(input.role);

  const entry = await prisma.constructionTimeEntry.findFirst({
    where: {
      workOrderId: input.siteId,
      userId: input.userId,
      clockOutAt: null,
    },
    orderBy: { clockInAt: "desc" },
  });

  return mapTimeEntry(entry);
}

export async function listTimeEntriesForSite(input: SiteInput) {
  assertConstructionRole(input.role);

  const entries = await prisma.constructionTimeEntry.findMany({
    where: {
      workOrderId: input.siteId,
      ...(isFieldRole(input.role) ? { userId: input.userId } : {}),
    },
    orderBy: {
      clockInAt: "desc",
    },
    take: 25,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  return entries.map((entry) => ({
    ...mapTimeEntry(entry),
    user: entry.user
      ? {
          id: entry.user.id,
          first_name: entry.user.firstName,
          last_name: entry.user.lastName,
          role: entry.user.role,
        }
      : null,
  }));
}

export async function clockInToSite(input: ClockInput) {
  assertConstructionRole(input.role);

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(isFieldRole(input.role)
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
    select: {
      id: true,
      workOrderNumber: true,
      internalStatus: true,
    },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const existingOpenEntry = await prisma.constructionTimeEntry.findFirst({
    where: {
      userId: input.userId,
      clockOutAt: null,
    },
  });

  if (existingOpenEntry) {
    throw new AppError(
      "You are already clocked in. Clock out before starting another site.",
      409,
      "ALREADY_CLOCKED_IN",
    );
  }

  const entry = await prisma.constructionTimeEntry.create({
    data: {
      workOrderId: site.id,
      userId: input.userId,
      clockInAt: new Date(),
      clockInLat: input.latitude,
      clockInLng: input.longitude,
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: site.id,
      eventType: "construction_clock_in",
      label: "Clocked In",
      createdByUserId: input.userId,
      metadata: {
        timeEntryId: entry.id,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    },
  });

  return mapTimeEntry(entry);
}

export async function clockOutOfSite(input: ClockInput) {
  assertConstructionRole(input.role);

  const entry = await prisma.constructionTimeEntry.findFirst({
    where: {
      workOrderId: input.siteId,
      userId: input.userId,
      clockOutAt: null,
    },
    orderBy: { clockInAt: "desc" },
  });

  if (!entry) {
    throw new AppError("No active clock-in found for this site.", 404, "NO_ACTIVE_TIME_ENTRY");
  }

  const updated = await prisma.constructionTimeEntry.update({
    where: { id: entry.id },
    data: {
      clockOutAt: new Date(),
      clockOutLat: input.latitude,
      clockOutLng: input.longitude,
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: input.siteId,
      eventType: "construction_clock_out",
      label: "Clocked Out",
      createdByUserId: input.userId,
      metadata: {
        timeEntryId: updated.id,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    },
  });

  return mapTimeEntry(updated);
}

export async function createConstructionNote(input: {
  siteId: string;
  userId: string;
  role: string;
  body: string;
}) {
  assertConstructionRole(input.role);

  const body = input.body.trim();

  if (!body) {
    throw new AppError("Note cannot be empty.", 400, "INVALID_INPUT");
  }

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(isFieldRole(input.role)
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
    select: {
      id: true,
      workOrderNumber: true,
    },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const note = await prisma.workOrderNote.create({
    data: {
      workOrderId: site.id,
      noteType: "general",
      body,
      createdByUserId: input.userId,
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: site.id,
      eventType: "construction_note",
      label: "Note Added",
      createdByUserId: input.userId,
      metadata: {
        noteId: note.id,
      },
    },
  });

  return {
    id: note.id,
    work_order_id: note.workOrderId,
    work_order_number: site.workOrderNumber,
    note_type: note.noteType,
    body: note.body,
    created_by_user_id: note.createdByUserId,
    created_at: note.createdAt,
  };
}

export async function uploadConstructionMedia(input: {
  siteId: string;
  userId: string;
  role: string;
  fileBuffer: Buffer;
  mimeType: string;
  originalFileName: string;
  fileSizeBytes?: number;
  mediaType?: string;
}) {
  assertConstructionRole(input.role);

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(isFieldRole(input.role)
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
    select: {
      id: true,
      workOrderNumber: true,
    },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const safeFileName = input.originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = `construction/${site.workOrderNumber}/${Date.now()}-${safeFileName}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: objectKey,
      Body: input.fileBuffer,
      ContentType: input.mimeType,
    }),
  );

  const media = await prisma.workOrderMedia.create({
    data: {
      workOrderId: site.id,
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

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: site.id,
      eventType: "construction_photo_uploaded",
      label: "Photo Added",
      createdByUserId: input.userId,
      metadata: {
        mediaId: media.id,
        objectKey,
      },
    },
  });

  return {
    id: media.id,
    work_order_id: media.workOrderId,
    media_type: media.mediaType,
    object_key: media.objectKey,
    url: `${env.R2_PUBLIC_BASE_URL}/${media.objectKey}`,
    created_at: media.createdAt,
  };
}

export async function getConstructionActivityFeed(input: SiteInput) {
  assertConstructionRole(input.role);

  const fieldRole = isFieldRole(input.role);

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(fieldRole
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
    select: { id: true },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const events = await prisma.workOrderEvent.findMany({
    where: {
      workOrderId: site.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return events.map((event) => ({
    id: event.id,
    event_type: event.eventType,
    label: event.label,
    metadata: event.metadata,
    created_by_user_id: event.createdByUserId,
    created_at: event.createdAt,
  }));
}

export async function deleteConstructionNote(input: {
  noteId: string;
  userId: string;
  role: string;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  const note = await prisma.workOrderNote.findFirst({
    where: {
      id: input.noteId,
      workOrder: {
        division: "construction",
      },
    },
  });

  if (!note) {
    throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
  }

  await prisma.workOrderNote.delete({
    where: { id: note.id },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: note.workOrderId,
      eventType: "construction_note_deleted",
      label: "Note Deleted",
      createdByUserId: input.userId,
      metadata: {
        noteId: note.id,
      },
    },
  });

  return {
    id: note.id,
    status: "deleted",
  };
}

export async function deleteConstructionMedia(input: {
  mediaId: string;
  userId: string;
  role: string;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  const media = await prisma.workOrderMedia.findFirst({
    where: {
      id: input.mediaId,
      deletedAt: null,
      workOrder: {
        division: "construction",
      },
    },
  });

  if (!media) {
    throw new AppError("Photo not found", 404, "MEDIA_NOT_FOUND");
  }

  const updated = await prisma.workOrderMedia.update({
    where: { id: media.id },
    data: {
      deletedAt: new Date(),
      deletedByUserId: input.userId,
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: media.workOrderId,
      eventType: "construction_photo_deleted",
      label: "Photo Deleted",
      createdByUserId: input.userId,
      metadata: {
        mediaId: media.id,
      },
    },
  });

  return {
    id: updated.id,
    status: "deleted",
    deleted_at: updated.deletedAt,
  };
}

export async function getMissedClockOuts(input: RoleInput) {
  assertConstructionRole(input.role);

  if (!isAdminConstructionRole(input.role)) {
    throw new AppError(
      "Only admin, operations, or dispatcher can view missed clock-outs.",
      403,
      "FORBIDDEN",
    );
  }

  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

  const entries = await prisma.constructionTimeEntry.findMany({
    where: {
      clockOutAt: null,
      clockInAt: {
        lte: twelveHoursAgo,
      },
    },
    orderBy: {
      clockInAt: "asc",
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
      },
      workOrder: {
        include: {
          customer: true,
          address: true,
        },
      },
    },
  });

  const now = Date.now();

  return entries.map((entry) => {
    const durationMinutes = Math.max(
      0,
      Math.floor((now - entry.clockInAt.getTime()) / 60000),
    );

    return {
      id: entry.id,
      clock_in_at: entry.clockInAt,
      clock_in_lat: entry.clockInLat,
      clock_in_lng: entry.clockInLng,
      duration_minutes: durationMinutes,
      alert_type: "missed_clock_out",
      severity: durationMinutes >= 16 * 60 ? "high" : "medium",
      user: {
        id: entry.user.id,
        first_name: entry.user.firstName,
        last_name: entry.user.lastName,
        email: entry.user.email,
        role: entry.user.role,
      },
      site: {
        id: entry.workOrder.id,
        work_order_number: entry.workOrder.workOrderNumber,
        customer_reference_number: entry.workOrder.customerReferenceNumber,
        internal_status: entry.workOrder.internalStatus,
        customer: {
          id: entry.workOrder.customer.id,
          full_name: entry.workOrder.customer.fullName,
          phone: entry.workOrder.customer.phone,
          email: entry.workOrder.customer.email,
        },
        address: {
          id: entry.workOrder.address.id,
          line1: entry.workOrder.address.line1,
          city: entry.workOrder.address.city,
          state: entry.workOrder.address.state,
          postal_code: entry.workOrder.address.postalCode,
        },
      },
    };
  });
}

export async function listConstructionCrew(input: RoleInput) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["installer", "delivery_lead"],
      },
      isActive: true,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    role: user.role,
  }));
}

export async function assignCrewToSite(input: {
  siteId: string;
  assignedUserId: string;
  assignmentType: string;
  userId: string;
  role: string;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  if (!input.assignedUserId) {
    throw new AppError("User is required.", 400, "INVALID_INPUT");
  }

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
    },
    select: {
      id: true,
      workOrderNumber: true,
    },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const crewUser = await prisma.user.findFirst({
    where: {
      id: input.assignedUserId,
      role: {
        in: ["installer", "delivery_lead"],
      },
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  });

  if (!crewUser) {
    throw new AppError("Crew user not found", 404, "USER_NOT_FOUND");
  }

  const existing = await prisma.workOrderAssignment.findFirst({
    where: {
      workOrderId: site.id,
      userId: crewUser.id,
      isActive: true,
    },
  });

  if (existing) {
    throw new AppError("This crew member is already assigned to this site.", 409, "ALREADY_ASSIGNED");
  }

  const assignment = await prisma.workOrderAssignment.create({
    data: {
      workOrderId: site.id,
      userId: crewUser.id,
      assignmentType: input.assignmentType || "crew",
      isActive: true,
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: site.id,
      eventType: "construction_crew_assigned",
      label: "Crew Assigned",
      createdByUserId: input.userId,
      metadata: {
        assignmentId: assignment.id,
        assignedUserId: crewUser.id,
        assignedUserName: `${crewUser.firstName} ${crewUser.lastName}`,
        assignmentType: input.assignmentType,
      },
    },
  });

  return {
    id: assignment.id,
    assignment_type: assignment.assignmentType,
    assigned_at: assignment.assignedAt,
    user: {
      id: crewUser.id,
      first_name: crewUser.firstName,
      last_name: crewUser.lastName,
      email: crewUser.email,
      role: crewUser.role,
    },
  };
}

export async function removeCrewFromSite(input: {
  siteId: string;
  assignmentId: string;
  userId: string;
  role: string;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  const assignment = await prisma.workOrderAssignment.findFirst({
    where: {
      id: input.assignmentId,
      workOrderId: input.siteId,
      isActive: true,
      workOrder: {
        division: "construction",
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
  }

  const updated = await prisma.workOrderAssignment.update({
    where: {
      id: assignment.id,
    },
    data: {
      isActive: false,
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: input.siteId,
      eventType: "construction_crew_removed",
      label: "Crew Removed",
      createdByUserId: input.userId,
      metadata: {
        assignmentId: assignment.id,
        removedUserId: assignment.user?.id,
        removedUserName: assignment.user ? `${assignment.user.firstName} ${assignment.user.lastName}` : null,
      },
    },
  });

  return {
    id: updated.id,
    status: "removed",
  };
}

export async function listConstructionProjects(input: RoleInput) {
  assertConstructionRole(input.role);

  if (!isAdminConstructionRole(input.role)) {
    throw new AppError(
      "Only admin, operations, or dispatcher can manage construction projects.",
      403,
      "FORBIDDEN",
    );
  }

  const projects = await prisma.workOrder.findMany({
    where: {
      division: "construction",
    },
    orderBy: [{ scheduledStartAt: "asc" }, { createdAt: "desc" }],
    include: {
      customer: true,
      address: true,
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
      constructionTasks: true,
      constructionPunchItems: true,
    },
  });

  return projects.map((project) => {
    const mapped = mapSite(project);
    const total = project.constructionTasks.length;
    const completed = project.constructionTasks.filter((task) => task.status === "completed").length;
    const blocked = project.constructionTasks.filter((task) => task.status === "blocked").length;
    const overdue = project.constructionTasks.filter(
      (task) => task.dueDate && task.dueDate < new Date() && task.status !== "completed",
    ).length;
    const openPunchItems = project.constructionPunchItems.filter(
      (item) => !["completed", "cancelled"].includes(item.status),
    ).length;

    return {
      ...mapped,
      progress: {
        total,
        completed,
        blocked,
        overdue,
        open_punch_items: openPunchItems,
        completion_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    };
  });
}

export async function createConstructionProject(input: {
  userId: string;
  role: string;
  customerName: string;
  projectName: string;
  projectType: string;
  trades: string[];
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  dispatcherNotes: string;
  scheduledStartAt: string | null;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  if (!input.customerName.trim()) {
    throw new AppError("Customer name is required.", 400, "INVALID_INPUT");
  }

  if (!input.projectName.trim()) {
    throw new AppError("Project name is required.", 400, "INVALID_INPUT");
  }

  if (!input.projectType.trim()) {
    throw new AppError("Project type is required.", 400, "INVALID_INPUT");
  }

  if (!input.trades.length) {
    throw new AppError("At least one trade is required.", 400, "INVALID_INPUT");
  }

  const cleanTrades = input.trades.map((trade) => trade.trim()).filter(Boolean);

  const projectTypeLabel = input.projectType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const accessNotes = [
    `Project Type: ${projectTypeLabel}`,
    cleanTrades.length ? `Trades: ${cleanTrades.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const created = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        fullName: input.customerName.trim(),
      },
    });

    const address = await tx.address.create({
      data: {
        line1: input.addressLine1.trim() || "TBD",
        city: input.city.trim() || "TBD",
        state: input.state.trim() || "TBD",
        postalCode: input.postalCode.trim() || "TBD",
        country: "US",
      },
    });

    const count = await tx.workOrder.count({
      where: {
        division: "construction",
      },
    });

    const workOrderNumber = `CON-${String(count + 1).padStart(5, "0")}`;

    const workOrder = await tx.workOrder.create({
      data: {
        workOrderNumber,
        customerReferenceNumber: input.projectName.trim(),
        customerId: customer.id,
        addressId: address.id,
        jobType: "installation",
        division: "construction",
        internalStatus: "ready_to_schedule",
        priority: "normal",
        dispatcherNotes: input.dispatcherNotes.trim() || null,
        accessNotes,
        scheduledStartAt: input.scheduledStartAt ? new Date(input.scheduledStartAt) : null,
        searchText: [
          workOrderNumber,
          input.customerName,
          input.projectName,
          projectTypeLabel,
          ...cleanTrades,
          input.addressLine1,
          input.city,
          input.state,
          input.postalCode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      },
      include: {
        customer: true,
        address: true,
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

    await tx.workOrderEvent.create({
      data: {
        workOrderId: workOrder.id,
        eventType: "construction_project_created",
        label: "Project Created",
        createdByUserId: input.userId,
        metadata: {
          projectName: input.projectName.trim(),
          projectType: input.projectType,
          projectTypeLabel,
          trades: cleanTrades,
        },
      },
    });

    return workOrder;
  });

  return mapSite(created);
}

export async function deleteConstructionProject(input: {
  projectId: string;
  userId: string;
  role: string;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  const project = await prisma.workOrder.findFirst({
    where: {
      id: input.projectId,
      division: "construction",
    },
    select: {
      id: true,
      workOrderNumber: true,
    },
  });

  if (!project) {
    throw new AppError("Construction project not found", 404, "PROJECT_NOT_FOUND");
  }

  await prisma.workOrder.update({
    where: { id: project.id },
    data: {
      internalStatus: "cancelled",
      isLocked: true,
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: project.id,
      eventType: "construction_project_deleted",
      label: "Project Deleted",
      createdByUserId: input.userId,
      metadata: {
        workOrderNumber: project.workOrderNumber,
      },
    },
  });

  return {
    id: project.id,
    status: "deleted",
  };
}

export async function updateConstructionProjectStatus(input: {
  projectId: string;
  userId: string;
  role: string;
  status: string;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  const allowedStatuses = [
    "ready_to_schedule",
    "scheduled",
    "dispatched",
    "on_site",
    "completed",
    "follow_up_required",
    "cancelled",
  ];

  if (!allowedStatuses.includes(input.status)) {
    throw new AppError("Invalid project status.", 400, "INVALID_STATUS");
  }

  const project = await prisma.workOrder.findFirst({
    where: {
      id: input.projectId,
      division: "construction",
    },
  });

  if (!project) {
    throw new AppError("Construction project not found", 404, "PROJECT_NOT_FOUND");
  }

  const updated = await prisma.workOrder.update({
    where: { id: project.id },
    data: {
      internalStatus: input.status as any,
    },
    include: {
      customer: true,
      address: true,
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

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: project.id,
      eventType: "construction_status_updated",
      label: "Status Updated",
      createdByUserId: input.userId,
      metadata: {
        from: project.internalStatus,
        to: input.status,
      },
    },
  });

  return mapSite(updated);
}

export async function listConstructionTasks(input: SiteInput) {
  assertConstructionRole(input.role);

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(isFieldRole(input.role)
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
    select: { id: true },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const tasks = await prisma.constructionTask.findMany({
    where: {
      workOrderId: site.id,
      ...(isFieldRole(input.role)
        ? {
            OR: [{ assignedToUserId: input.userId }, { assignedToUserId: null }],
          }
        : {}),
    },
    orderBy: [{ trade: "asc" }, { createdAt: "asc" }],
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
      },
    },
  });

  return tasks.map(mapConstructionTask);
}

export async function createConstructionTask(input: {
  siteId: string;
  userId: string;
  role: string;
  title: string;
  trade: string;
  assignedToUserId: string | null;
  dueDate: string | null;
  notes: string;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  if (!input.title.trim()) {
    throw new AppError("Task title is required.", 400, "INVALID_INPUT");
  }

  if (!input.trade.trim()) {
    throw new AppError("Trade is required.", 400, "INVALID_INPUT");
  }

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
    },
    select: { id: true },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const task = await prisma.constructionTask.create({
    data: {
      workOrderId: site.id,
      title: input.title.trim(),
      trade: input.trade.trim(),
      assignedToUserId: input.assignedToUserId,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes.trim() || null,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
      },
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: site.id,
      eventType: "construction_task_created",
      label: "Task Created",
      createdByUserId: input.userId,
      metadata: {
        taskId: task.id,
        title: task.title,
        trade: task.trade,
      },
    },
  });

  return mapConstructionTask(task);
}

export async function updateConstructionTask(input: {
  taskId: string;
  userId: string;
  role: string;
  title?: string;
  trade?: string;
  status?: string;
  assignedToUserId?: string;
  dueDate?: string;
  notes?: string;
}) {
  assertConstructionRole(input.role);

  const task = await prisma.constructionTask.findFirst({
    where: {
      id: input.taskId,
      workOrder: {
        division: "construction",
      },
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
  }

  const adminView = isAdminConstructionRole(input.role);

  if (!adminView && task.assignedToUserId !== input.userId) {
    throw new AppError("You can only update tasks assigned to you.", 403, "FORBIDDEN");
  }

  const allowedStatuses = ["todo", "in_progress", "blocked", "completed"];

  if (input.status && !allowedStatuses.includes(input.status)) {
    throw new AppError("Invalid task status.", 400, "INVALID_STATUS");
  }

  const updated = await prisma.constructionTask.update({
    where: { id: task.id },
    data: {
      ...(adminView && input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(adminView && input.trade !== undefined ? { trade: input.trade.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(adminView && input.assignedToUserId !== undefined
        ? { assignedToUserId: input.assignedToUserId || null }
        : {}),
      ...(adminView && input.dueDate !== undefined
        ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
      },
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: task.workOrderId,
      eventType: "construction_task_updated",
      label: "Task Updated",
      createdByUserId: input.userId,
      metadata: {
        taskId: task.id,
        status: input.status,
      },
    },
  });

  return mapConstructionTask(updated);
}

export async function deleteConstructionTask(input: {
  taskId: string;
  userId: string;
  role: string;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  const task = await prisma.constructionTask.findFirst({
    where: {
      id: input.taskId,
      workOrder: {
        division: "construction",
      },
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
  }

  await prisma.constructionTask.delete({
    where: { id: task.id },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: task.workOrderId,
      eventType: "construction_task_deleted",
      label: "Task Deleted",
      createdByUserId: input.userId,
      metadata: {
        taskId: task.id,
        title: task.title,
      },
    },
  });

  return {
    id: task.id,
    status: "deleted",
  };
}

export async function getConstructionProjectProgress(input: SiteInput) {
  assertConstructionRole(input.role);

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(isFieldRole(input.role)
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
    select: { id: true },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const [tasks, punchItems] = await Promise.all([
    prisma.constructionTask.findMany({
      where: {
        workOrderId: site.id,
        ...(isFieldRole(input.role)
          ? {
              OR: [{ assignedToUserId: input.userId }, { assignedToUserId: null }],
            }
          : {}),
      },
      select: {
        id: true,
        status: true,
        dueDate: true,
        trade: true,
      },
    }),
    prisma.constructionPunchItem.findMany({
      where: {
        workOrderId: site.id,
        ...(isFieldRole(input.role)
          ? {
              OR: [{ assignedToUserId: input.userId }, { assignedToUserId: null }],
            }
          : {}),
      },
      select: {
        id: true,
        status: true,
        priority: true,
        trade: true,
      },
    }),
  ]);

  const now = new Date();

  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const todo = tasks.filter((task) => task.status === "todo").length;
  const overdue = tasks.filter(
    (task) => task.dueDate && task.dueDate < now && task.status !== "completed",
  ).length;

  const openPunchItems = punchItems.filter((item) => !["completed", "cancelled"].includes(item.status)).length;
  const urgentPunchItems = punchItems.filter(
    (item) => item.priority === "urgent" && !["completed", "cancelled"].includes(item.status),
  ).length;

  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const byTrade = tasks.reduce<Record<string, any>>((acc, task) => {
    const trade = task.trade || "Unassigned";

    if (!acc[trade]) {
      acc[trade] = {
        trade,
        total: 0,
        completed: 0,
        in_progress: 0,
        blocked: 0,
        todo: 0,
        overdue: 0,
        completion_percent: 0,
      };
    }

    acc[trade].total += 1;

    if (task.status === "completed") acc[trade].completed += 1;
    if (task.status === "in_progress") acc[trade].in_progress += 1;
    if (task.status === "blocked") acc[trade].blocked += 1;
    if (task.status === "todo") acc[trade].todo += 1;

    if (task.dueDate && task.dueDate < now && task.status !== "completed") {
      acc[trade].overdue += 1;
    }

    return acc;
  }, {});

  Object.values(byTrade).forEach((item: any) => {
    item.completion_percent = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
  });

  return {
    total,
    completed,
    in_progress: inProgress,
    blocked,
    todo,
    overdue,
    open_punch_items: openPunchItems,
    urgent_punch_items: urgentPunchItems,
    completion_percent: completionPercent,
    by_trade: Object.values(byTrade),
  };
}

export async function getConstructionCrewAvailability(input: {
  userId: string;
  role: string;
  date: string;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  if (!input.date) {
    throw new AppError("Date is required.", 400, "INVALID_INPUT");
  }

  const selectedDate = new Date(`${input.date}T12:00:00.000Z`);

  if (Number.isNaN(selectedDate.getTime())) {
    throw new AppError("Invalid date.", 400, "INVALID_DATE");
  }

  const dayStart = new Date(selectedDate);
  dayStart.setUTCHours(0, 0, 0, 0);

  const dayEnd = new Date(selectedDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const crew = await prisma.user.findMany({
    where: {
      role: {
        in: ["installer", "delivery_lead"],
      },
      isActive: true,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  });

  const assignedWork = await prisma.workOrderAssignment.findMany({
    where: {
      isActive: true,
      userId: {
        in: crew.map((user) => user.id),
      },
      workOrder: {
        division: "construction",
        isLocked: false,
        internalStatus: {
          notIn: ["completed", "cancelled"],
        },
        scheduledStartAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    },
    include: {
      workOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          customerReferenceNumber: true,
          internalStatus: true,
          scheduledStartAt: true,
          customer: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  const assignmentsByUserId = new Map<string, any[]>();

  for (const assignment of assignedWork) {
    const existing = assignmentsByUserId.get(assignment.userId) || [];
    existing.push(assignment);
    assignmentsByUserId.set(assignment.userId, existing);
  }

  return crew.map((user) => {
    const assignments = assignmentsByUserId.get(user.id) || [];
    const available = assignments.length === 0;

    return {
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      role: user.role,
      available,
      workload_count: assignments.length,
      reason: available
        ? null
        : `Already assigned to ${assignments.map((item) => item.workOrder.workOrderNumber).join(", ")}`,
      assignments: assignments.map((item) => ({
        assignment_id: item.id,
        project_id: item.workOrder.id,
        work_order_number: item.workOrder.workOrderNumber,
        project_name: item.workOrder.customerReferenceNumber,
        status: item.workOrder.internalStatus,
        scheduled_start_at: item.workOrder.scheduledStartAt,
        customer_name: item.workOrder.customer?.fullName || null,
      })),
    };
  });
}

export async function getConstructionDailyReportV2(input: {
  siteId: string;
  userId: string;
  role: string;
  date?: string;
}) {
  assertConstructionRole(input.role);

  const fieldRole = isFieldRole(input.role);
  const { start, end, dateKey } = getReportDayRange(input.date);

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(fieldRole
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
    include: {
      customer: true,
      address: true,
      assignments: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const [savedReport, timeEntries, notes, sitePhotos, tasks] = await Promise.all([
    prisma.constructionDailyReport.findUnique({
      where: {
        workOrderId_reportDate: {
          workOrderId: site.id,
          reportDate: start,
        },
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
    prisma.constructionTimeEntry.findMany({
      where: {
        workOrderId: site.id,
        clockInAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { clockInAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
    prisma.workOrderNote.findMany({
      where: {
        workOrderId: site.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
    prisma.workOrderMedia.findMany({
      where: {
        workOrderId: site.id,
        deletedAt: null,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.constructionTask.findMany({
      where: {
        workOrderId: site.id,
        updatedAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { updatedAt: "asc" },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const totalMinutes = timeEntries.reduce((sum, entry) => {
    if (!entry.clockOutAt) return sum;

    return sum + Math.max(0, Math.floor((entry.clockOutAt.getTime() - entry.clockInAt.getTime()) / 60000));
  }, 0);

  return {
    date: dateKey,
    site: mapSite(site),
    report: mapDailyReport(savedReport),
    auto_summary: {
      total_minutes: totalMinutes,
      time_entries_count: timeEntries.length,
      notes_count: notes.length,
      photos_count: sitePhotos.length,
      task_updates_count: tasks.length,
      crew: timeEntries.map((entry) => ({
        id: entry.user.id,
        first_name: entry.user.firstName,
        last_name: entry.user.lastName,
        role: entry.user.role,
        clock_in_at: entry.clockInAt,
        clock_out_at: entry.clockOutAt,
      })),
      notes: notes.map((note) => ({
        id: note.id,
        body: note.body,
        created_at: note.createdAt,
        created_by: note.createdBy
          ? {
              id: note.createdBy.id,
              first_name: note.createdBy.firstName,
              last_name: note.createdBy.lastName,
              role: note.createdBy.role,
            }
          : null,
      })),
      photos: sitePhotos.map((photo) => ({
        id: photo.id,
        media_type: photo.mediaType,
        created_at: photo.createdAt,
        url: `${env.R2_PUBLIC_BASE_URL}/${photo.objectKey}`,
      })),
      task_updates: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        trade: task.trade,
        status: task.status,
        updated_at: task.updatedAt,
        assigned_to: task.assignedTo
          ? {
              id: task.assignedTo.id,
              first_name: task.assignedTo.firstName,
              last_name: task.assignedTo.lastName,
              role: task.assignedTo.role,
            }
          : null,
      })),
    },
  };
}

export async function saveConstructionDailyReport(input: {
  siteId: string;
  userId: string;
  role: string;
  date: string;
  workCompleted: string;
  blockers: string;
  materialsUsed: string;
  safetyNotes: string;
  weatherNotes: string;
}) {
  assertConstructionRole(input.role);

  const { start } = getReportDayRange(input.date);

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(isFieldRole(input.role)
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
    select: { id: true },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const report = await prisma.constructionDailyReport.upsert({
    where: {
      workOrderId_reportDate: {
        workOrderId: site.id,
        reportDate: start,
      },
    },
    update: {
      workCompleted: input.workCompleted.trim() || null,
      blockers: input.blockers.trim() || null,
      materialsUsed: input.materialsUsed.trim() || null,
      safetyNotes: input.safetyNotes.trim() || null,
      weatherNotes: input.weatherNotes.trim() || null,
    },
    create: {
      workOrderId: site.id,
      reportDate: start,
      workCompleted: input.workCompleted.trim() || null,
      blockers: input.blockers.trim() || null,
      materialsUsed: input.materialsUsed.trim() || null,
      safetyNotes: input.safetyNotes.trim() || null,
      weatherNotes: input.weatherNotes.trim() || null,
    },
    include: {
      submittedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: site.id,
      eventType: "construction_daily_report_saved",
      label: "Daily Report Saved",
      createdByUserId: input.userId,
      metadata: {
        reportId: report.id,
        reportDate: start.toISOString().slice(0, 10),
      },
    },
  });

  return mapDailyReport(report);
}

export async function submitConstructionDailyReport(input: {
  siteId: string;
  userId: string;
  role: string;
  date: string;
}) {
  assertConstructionRole(input.role);

  const { start } = getReportDayRange(input.date);

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(isFieldRole(input.role)
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
    select: { id: true },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const existing = await prisma.constructionDailyReport.findUnique({
    where: {
      workOrderId_reportDate: {
        workOrderId: site.id,
        reportDate: start,
      },
    },
  });

  if (!existing) {
    throw new AppError("Save the daily report before submitting.", 400, "REPORT_NOT_SAVED");
  }

  const report = await prisma.constructionDailyReport.update({
    where: { id: existing.id },
    data: {
      submittedByUserId: input.userId,
      submittedAt: new Date(),
    },
    include: {
      submittedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: site.id,
      eventType: "construction_daily_report_submitted",
      label: "Daily Report Submitted",
      createdByUserId: input.userId,
      metadata: {
        reportId: report.id,
        reportDate: start.toISOString().slice(0, 10),
      },
    },
  });

  return mapDailyReport(report);
}

export async function getConstructionTaskDetail(input: {
  taskId: string;
  userId: string;
  role: string;
}) {
  assertConstructionRole(input.role);

  const task = await prisma.constructionTask.findFirst({
    where: {
      id: input.taskId,
      workOrder: {
        division: "construction",
        ...(isFieldRole(input.role)
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
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
      },
      notesList: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
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
      workOrder: {
        include: {
          customer: true,
          address: true,
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
      },
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
  }

  if (isFieldRole(input.role) && task.assignedToUserId && task.assignedToUserId !== input.userId) {
    throw new AppError("You can only view tasks assigned to you.", 403, "FORBIDDEN");
  }

  return {
    task: mapConstructionTask(task),
    site: mapSite(task.workOrder),
    notes: task.notesList.map(mapConstructionTaskNote),
    photos: task.media.map(mapConstructionTaskMedia),
  };
}

export async function createConstructionTaskNote(input: {
  taskId: string;
  userId: string;
  role: string;
  body: string;
}) {
  assertConstructionRole(input.role);

  const body = input.body.trim();

  if (!body) {
    throw new AppError("Note cannot be empty.", 400, "INVALID_INPUT");
  }

  const task = await prisma.constructionTask.findFirst({
    where: {
      id: input.taskId,
      workOrder: {
        division: "construction",
        ...(isFieldRole(input.role)
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
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
  }

  if (isFieldRole(input.role) && task.assignedToUserId && task.assignedToUserId !== input.userId) {
    throw new AppError("You can only add notes to tasks assigned to you.", 403, "FORBIDDEN");
  }

  const note = await prisma.constructionTaskNote.create({
    data: {
      taskId: task.id,
      body,
      createdByUserId: input.userId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: task.workOrderId,
      eventType: "construction_task_note_added",
      label: "Task Note Added",
      createdByUserId: input.userId,
      metadata: {
        taskId: task.id,
        noteId: note.id,
      },
    },
  });

  return mapConstructionTaskNote(note);
}

export async function uploadConstructionTaskMedia(input: {
  taskId: string;
  userId: string;
  role: string;
  fileBuffer: Buffer;
  mimeType: string;
  originalFileName: string;
  fileSizeBytes?: number;
  mediaType?: string;
}) {
  assertConstructionRole(input.role);

  const task = await prisma.constructionTask.findFirst({
    where: {
      id: input.taskId,
      workOrder: {
        division: "construction",
        ...(isFieldRole(input.role)
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
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
  }

  if (isFieldRole(input.role) && task.assignedToUserId && task.assignedToUserId !== input.userId) {
    throw new AppError("You can only add photos to tasks assigned to you.", 403, "FORBIDDEN");
  }

  const safeFileName = input.originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = `construction/tasks/${task.id}/${Date.now()}-${safeFileName}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: objectKey,
      Body: input.fileBuffer,
      ContentType: input.mimeType,
    }),
  );

  const media = await prisma.constructionTaskMedia.create({
    data: {
      taskId: task.id,
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

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: task.workOrderId,
      eventType: "construction_task_photo_uploaded",
      label: "Task Photo Added",
      createdByUserId: input.userId,
      metadata: {
        taskId: task.id,
        mediaId: media.id,
        objectKey,
      },
    },
  });

  return mapConstructionTaskMedia(media);
}

export async function listConstructionPunchItems(input: SiteInput) {
  assertConstructionRole(input.role);

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(isFieldRole(input.role)
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
    select: { id: true },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const items = await prisma.constructionPunchItem.findMany({
    where: {
      workOrderId: site.id,
      ...(isFieldRole(input.role)
        ? {
            OR: [{ assignedToUserId: input.userId }, { assignedToUserId: null }],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  return items.map(mapConstructionPunchItem);
}

export async function createConstructionPunchItem(input: {
  siteId: string;
  userId: string;
  role: string;
  title: string;
  trade: string | null;
  priority: string;
  assignedToUserId: string | null;
  notes: string;
}) {
  assertConstructionRole(input.role);

  const title = input.title.trim();

  if (!title) {
    throw new AppError("Punch item title is required.", 400, "INVALID_INPUT");
  }

  const allowedPriorities = ["low", "normal", "high", "urgent"];

  if (!allowedPriorities.includes(input.priority)) {
    throw new AppError("Invalid priority.", 400, "INVALID_PRIORITY");
  }

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(isFieldRole(input.role)
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
    select: { id: true },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const item = await prisma.constructionPunchItem.create({
    data: {
      workOrderId: site.id,
      title,
      trade: input.trade?.trim() || null,
      priority: input.priority,
      assignedToUserId: input.assignedToUserId,
      notes: input.notes.trim() || null,
      createdByUserId: input.userId,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: site.id,
      eventType: "construction_punch_item_created",
      label: "Punch Item Created",
      createdByUserId: input.userId,
      metadata: {
        punchItemId: item.id,
        title: item.title,
        trade: item.trade,
        priority: item.priority,
      },
    },
  });

  return mapConstructionPunchItem(item);
}

export async function updateConstructionPunchItem(input: {
  punchItemId: string;
  userId: string;
  role: string;
  title?: string;
  trade?: string;
  priority?: string;
  status?: string;
  assignedToUserId?: string;
  notes?: string;
}) {
  assertConstructionRole(input.role);

  const existing = await prisma.constructionPunchItem.findFirst({
    where: {
      id: input.punchItemId,
      workOrder: {
        division: "construction",
      },
    },
  });

  if (!existing) {
    throw new AppError("Punch item not found.", 404, "PUNCH_ITEM_NOT_FOUND");
  }

  const adminView = isAdminConstructionRole(input.role);

  if (!adminView && existing.assignedToUserId !== input.userId) {
    throw new AppError("You can only update punch items assigned to you.", 403, "FORBIDDEN");
  }

  const allowedPriorities = ["low", "normal", "high", "urgent"];
  const allowedStatuses = ["open", "in_progress", "completed", "cancelled"];

  if (input.priority && !allowedPriorities.includes(input.priority)) {
    throw new AppError("Invalid priority.", 400, "INVALID_PRIORITY");
  }

  if (input.status && !allowedStatuses.includes(input.status)) {
    throw new AppError("Invalid status.", 400, "INVALID_STATUS");
  }

  const updated = await prisma.constructionPunchItem.update({
    where: { id: existing.id },
    data: {
      ...(adminView && input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(adminView && input.trade !== undefined ? { trade: input.trade.trim() || null } : {}),
      ...(adminView && input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.status !== undefined
        ? {
            status: input.status,
            completedAt: input.status === "completed" ? new Date() : null,
          }
        : {}),
      ...(adminView && input.assignedToUserId !== undefined
        ? { assignedToUserId: input.assignedToUserId || null }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: existing.workOrderId,
      eventType: "construction_punch_item_updated",
      label: "Punch Item Updated",
      createdByUserId: input.userId,
      metadata: {
        punchItemId: existing.id,
        fromStatus: existing.status,
        toStatus: input.status,
      },
    },
  });

  return mapConstructionPunchItem(updated);
}

export async function deleteConstructionPunchItem(input: {
  punchItemId: string;
  userId: string;
  role: string;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  const existing = await prisma.constructionPunchItem.findFirst({
    where: {
      id: input.punchItemId,
      workOrder: {
        division: "construction",
      },
    },
  });

  if (!existing) {
    throw new AppError("Punch item not found.", 404, "PUNCH_ITEM_NOT_FOUND");
  }

  await prisma.constructionPunchItem.delete({
    where: { id: existing.id },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: existing.workOrderId,
      eventType: "construction_punch_item_deleted",
      label: "Punch Item Deleted",
      createdByUserId: input.userId,
      metadata: {
        punchItemId: existing.id,
        title: existing.title,
      },
    },
  });

  return {
    id: existing.id,
    status: "deleted",
  };
}

export async function updateConstructionProjectSchedule(input: {
  projectId: string;
  userId: string;
  role: string;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
}) {
  assertConstructionRole(input.role);
  assertAdminConstructionRole(input.role);

  const scheduledStartAt = input.scheduledStartAt;

  if (!scheduledStartAt) {
    throw new AppError("Scheduled start date is required.", 400, "INVALID_INPUT");
  }

  const scheduledEndAt = input.scheduledEndAt || undefined;

  const startDate = new Date(scheduledStartAt);
  const endDate = scheduledEndAt ? new Date(scheduledEndAt) : null;

  if (Number.isNaN(startDate.getTime())) {
    throw new AppError("Invalid scheduled start date.", 400, "INVALID_DATE");
  }

  if (endDate && Number.isNaN(endDate.getTime())) {
    throw new AppError("Invalid scheduled end date.", 400, "INVALID_DATE");
  }

  const project = await prisma.workOrder.findFirst({
    where: {
      id: input.projectId,
      division: "construction",
    },
  });

  if (!project) {
    throw new AppError("Construction project not found.", 404, "PROJECT_NOT_FOUND");
  }

  const updated = await prisma.workOrder.update({
    where: { id: project.id },
    data: {
      scheduledStartAt: startDate,
      scheduledEndAt: endDate,
      internalStatus:
        project.internalStatus === "ready_to_schedule"
          ? "scheduled"
          : project.internalStatus,
    },
    include: {
      customer: true,
      address: true,
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

  await prisma.workOrderEvent.create({
    data: {
      workOrderId: project.id,
      eventType: "construction_project_rescheduled",
      label: "Project Rescheduled",
      createdByUserId: input.userId,
      metadata: {
        fromStart: project.scheduledStartAt,
        toStart: startDate,
        fromEnd: project.scheduledEndAt,
        toEnd: endDate,
      },
    },
  });

  return mapSite(updated);
}

export async function listConstructionDailyReports(input: SiteInput) {
  assertConstructionRole(input.role);

  const site = await prisma.workOrder.findFirst({
    where: {
      id: input.siteId,
      division: "construction",
      ...(isFieldRole(input.role)
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
    select: { id: true },
  });

  if (!site) {
    throw new AppError("Construction site not found", 404, "SITE_NOT_FOUND");
  }

  const reports = await prisma.constructionDailyReport.findMany({
    where: {
      workOrderId: site.id,
    },
    orderBy: {
      reportDate: "desc",
    },
    include: {
      submittedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  return reports.map(mapDailyReport);
}