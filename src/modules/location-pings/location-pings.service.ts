import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";

interface CreateLocationPingInput {
  userId: string;
  role: string;
  workOrderId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  isMocked?: boolean;
}

interface ListLiveLocationsInput {
  userId: string;
  role: string;
  division?: string;
}

function assertFieldRole(role: string) {
  const allowedRoles = ["admin", "dispatcher", "installer", "delivery_lead"];

  if (!allowedRoles.includes(role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function assertAdminOrDispatcher(role: string) {
  if (!["admin", "dispatcher"].includes(role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

export async function createLocationPing(input: CreateLocationPingInput) {
  assertFieldRole(input.role);

  if (!input.workOrderId) {
    throw new AppError("work_order_id is required", 400, "INVALID_REQUEST");
  }

  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    throw new AppError(
      "Valid latitude and longitude are required",
      400,
      "INVALID_REQUEST",
    );
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: input.workOrderId },
    select: {
      id: true,
      division: true,
      internalStatus: true,
      workOrderNumber: true,
    },
  });

  if (!workOrder) {
    throw new AppError("Work order not found", 404, "WORK_ORDER_NOT_FOUND");
  }

  const allowedStatuses = ["scheduled", "dispatched", "on_site"];
  if (!allowedStatuses.includes(String(workOrder.internalStatus))) {
    throw new AppError(
      "Location tracking is only allowed for active work",
      400,
      "WORK_ORDER_NOT_TRACKABLE",
    );
  }

  const hasAssignment = await prisma.workOrderAssignment.findFirst({
    where: {
      workOrderId: input.workOrderId,
      userId: input.userId,
      isActive: true,
    },
    select: { id: true },
  });

  if (!hasAssignment && !["admin", "dispatcher"].includes(input.role)) {
    throw new AppError(
      "User is not assigned to this work order",
      403,
      "FORBIDDEN",
    );
  }

  const ping = await prisma.locationPing.create({
    data: {
      userId: input.userId,
      workOrderId: input.workOrderId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      speed: input.speed,
      heading: input.heading,
      batteryLevel: input.batteryLevel,
      isMocked: input.isMocked ?? false,
      source: "mobile",
    },
  });

  return {
    id: ping.id,
    work_order_id: ping.workOrderId,
    latitude: ping.latitude,
    longitude: ping.longitude,
    accuracy: ping.accuracy,
    speed: ping.speed,
    heading: ping.heading,
    battery_level: ping.batteryLevel,
    is_mocked: ping.isMocked,
    created_at: ping.createdAt,
  };
}

export async function listLiveLocations(input: ListLiveLocationsInput) {
  assertAdminOrDispatcher(input.role);

  const since = new Date(Date.now() - 1000 * 60 * 30);

  const pings = await prisma.locationPing.findMany({
    where: {
      createdAt: { gte: since },
      workOrder: input.division
        ? { division: input.division as any }
        : undefined,
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      workOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          division: true,
          internalStatus: true,
          customer: {
            select: {
              fullName: true,
            },
          },
          hotShotDetails: {
            select: {
              pickupCity: true,
              pickupState: true,
              dropoffCity: true,
              dropoffState: true,
            },
          },
        },
      },
    },
  });

  const latestByUserAndWorkOrder = new Map<string, (typeof pings)[number]>();

  for (const ping of pings) {
    const key = `${ping.userId}:${ping.workOrderId}`;
    if (!latestByUserAndWorkOrder.has(key)) {
      latestByUserAndWorkOrder.set(key, ping);
    }
  }

  return Array.from(latestByUserAndWorkOrder.values()).map((ping) => ({
    id: ping.id,
    latitude: ping.latitude,
    longitude: ping.longitude,
    accuracy: ping.accuracy,
    speed: ping.speed,
    heading: ping.heading,
    battery_level: ping.batteryLevel,
    is_mocked: ping.isMocked,
    created_at: ping.createdAt,
    user: {
      id: ping.user.id,
      first_name: ping.user.firstName,
      last_name: ping.user.lastName,
      role: ping.user.role,
    },
    work_order: {
      id: ping.workOrder.id,
      work_order_number: ping.workOrder.workOrderNumber,
      division: ping.workOrder.division,
      internal_status: ping.workOrder.internalStatus,
      customer_name: ping.workOrder.customer?.fullName || null,
      pickup_city: ping.workOrder.hotShotDetails?.pickupCity || null,
      pickup_state: ping.workOrder.hotShotDetails?.pickupState || null,
      dropoff_city: ping.workOrder.hotShotDetails?.dropoffCity || null,
      dropoff_state: ping.workOrder.hotShotDetails?.dropoffState || null,
    },
  }));
}