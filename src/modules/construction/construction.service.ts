import { JobStatus } from "@prisma/client";
import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";

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

const activeConstructionStatuses = [
  JobStatus.new,
  JobStatus.ready_to_schedule,
  JobStatus.scheduled,
  JobStatus.dispatched,
  JobStatus.on_site,
];

function assertConstructionRole(role: string) {
  if (!allowedRoles.includes(role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function isFieldRole(role: string) {
  return ["installer", "delivery_lead"].includes(role);
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
      userId: input.userId,
    },
    orderBy: {
      clockInAt: "desc",
    },
    take: 10,
  });

  return entries.map(mapTimeEntry);
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