import { prisma } from "../../config/db";

type Input = {
  userId: string;
  role: string;
  companyId: string | null;
};

const activeRouteStatuses = [
  "scheduled",
  "dispatched",
  "on_site",
] as const;

export async function getActiveRouteNotifications({
  userId,
  role,
}: Input) {
  const isAdminOrOps = role === "admin" || role === "operations";

  const whereBase: any = {
    division: "hotshots",
    internalStatus: {
      in: activeRouteStatuses,
    },
  };

  if (!isAdminOrOps) {
    whereBase.assignments = {
      some: {
        userId,
      },
    };
  }

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const [activeRoutesCount, updatedRoutesCount, urgentRoutesCount] =
    await Promise.all([
      prisma.workOrder.count({
        where: whereBase,
      }),

      prisma.workOrder.count({
        where: {
          ...whereBase,
          updatedAt: {
            gte: thirtyMinutesAgo,
          },
        },
      }),

      prisma.workOrder.count({
        where: {
          ...whereBase,
          priority: {
            in: ["urgent", "high"],
          },
        },
      }),
    ]);

  return {
    activeRoutesCount,
    updatedRoutesCount,
    urgentRoutesCount,
  };
}