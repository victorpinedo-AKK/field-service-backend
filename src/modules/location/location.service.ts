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
    throw new AppError("Valid latitude and longitude are required", 400, "INVALID_REQUEST");
  }

  const job = await prisma.job.findUnique({
    where: { id: input.workOrderId },
    select: { id: true },
  });

  if (!job) {
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