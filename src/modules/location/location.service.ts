import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";

interface CreateLocationPingInput {
  userId: string;
  workOrderId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export async function createLocationPing(input: CreateLocationPingInput) {
  if (!input.workOrderId) {
    throw new AppError("work_order_id is required", 400, "INVALID_REQUEST");
  }

  if (
    typeof input.latitude !== "number" ||
    Number.isNaN(input.latitude) ||
    typeof input.longitude !== "number" ||
    Number.isNaN(input.longitude)
  ) {
    throw new AppError(
      "Valid latitude and longitude are required",
      400,
      "INVALID_REQUEST",
    );
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: input.workOrderId },
    select: { id: true },
  });

  if (!workOrder) {
    throw new AppError("Work order not found", 404, "WORK_ORDER_NOT_FOUND");
  }

  return prisma.locationPing.create({
    data: {
      userId: input.userId,
      workOrderId: input.workOrderId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy ?? null,
    },
  });
}

export async function getLatestLocations() {
  const latestPings = await prisma.locationPing.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      workOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          internalStatus: true,
        },
      },
    },
    take: 100,
  });

  const seen = new Set<string>();

  const deduped = latestPings.filter((item) => {
    if (seen.has(item.workOrderId)) {
      return false;
    }

    seen.add(item.workOrderId);
    return true;
  });

  return deduped.map((item) => ({
    id: item.id,
    work_order_id: item.workOrderId,
    work_order_number: item.workOrder.workOrderNumber,
    status: item.workOrder.internalStatus,
    latitude: item.latitude,
    longitude: item.longitude,
    accuracy: item.accuracy,
    created_at: item.createdAt,
    user: {
      id: item.user.id,
      first_name: item.user.firstName,
      last_name: item.user.lastName,
    },
  }));
}