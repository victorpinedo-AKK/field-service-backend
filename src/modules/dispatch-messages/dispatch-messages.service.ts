import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";

type DispatchTargetScope =
  | "all_active_field"
  | "role"
  | "user"
  | "work_order"
  | "company";

type DispatchMessageCategory =
  | "general"
  | "operations"
  | "sop"
  | "safety"
  | "maintenance"
  | "payroll_1099";

interface CreateDispatchMessageInput {
  userId: string;
  role: string;
  companyId?: string | null;
  title: string;
  body: string;
  priority?: string;
  targetScope?: DispatchTargetScope;
  targetRole?: string;
  targetUserId?: string;
  targetWorkOrderId?: string;
  targetCompanyId?: string;
  messageCategory?: DispatchMessageCategory;
  requiresAcknowledgement?: boolean;
  expiresAt?: string;
}

interface GetDispatchMessageDetailInput {
  id: string;
  userId: string;
  role: string;
}

interface ListDispatchMessagesInput {
  userId: string;
  role: string;
  companyId?: string | null;
  jobId?: string;
  unreadOnly?: boolean;
  targetScope?: DispatchTargetScope;
  messageCategory?: DispatchMessageCategory;
}

interface MarkDispatchMessageReadInput {
  id: string;
  userId: string;
  role: string;
}

interface AcknowledgeDispatchMessageInput {
  id: string;
  userId: string;
  role: string;
}

interface GetPendingBlockingMessagesInput {
  userId: string;
  role: string;
  companyId?: string | null;
  jobId?: string;
}

interface UpdateDispatchMessageInput {
  id: string;
  userId: string;
  role: string;
  title?: string;
  body?: string;
  priority?: string;
  isActive?: boolean;
  targetScope?: DispatchTargetScope;
  targetRole?: string | null;
  targetUserId?: string | null;
  targetWorkOrderId?: string | null;
  targetCompanyId?: string | null;
  messageCategory?: DispatchMessageCategory;
  requiresAcknowledgement?: boolean;
  expiresAt?: string | null;
}

function assertDispatchMessageAdminRole(role: string) {
  if (role !== "admin") {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function assertDispatchMessageReadRole(role: string) {
  const allowedRoles = ["admin", "dispatcher", "installer", "delivery_lead"];

  if (!allowedRoles.includes(role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function normalizePriority(priority?: string) {
  if (!priority) return "normal";

  const value = priority.trim().toLowerCase();
  return value === "urgent" ? "urgent" : "normal";
}

function normalizeTargetScope(scope?: string): DispatchTargetScope {
  const value = (scope || "all_active_field").trim().toLowerCase();

  if (
    value === "all_active_field" ||
    value === "role" ||
    value === "user" ||
    value === "work_order" ||
    value === "company"
  ) {
    return value;
  }

  throw new AppError("Invalid target_scope", 400, "INVALID_REQUEST");
}

function normalizeMessageCategory(
  category?: string,
): DispatchMessageCategory {
  const value = (category || "general").trim().toLowerCase();

  if (
    value === "general" ||
    value === "operations" ||
    value === "sop" ||
    value === "safety" ||
    value === "maintenance" ||
    value === "payroll_1099"
  ) {
    return value as DispatchMessageCategory;
  }

  throw new AppError("Invalid message_category", 400, "INVALID_REQUEST");
}

function normalizeNullableString(value?: string | null) {
  if (value === undefined || value === null) return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function validateTargeting(input: {
  targetScope: DispatchTargetScope;
  targetRole?: string | null;
  targetUserId?: string | null;
  targetWorkOrderId?: string | null;
  targetCompanyId?: string | null;
}) {
  const targetRole = normalizeNullableString(input.targetRole);
  const targetUserId = normalizeNullableString(input.targetUserId);
  const targetWorkOrderId = normalizeNullableString(input.targetWorkOrderId);
  const targetCompanyId = normalizeNullableString(input.targetCompanyId);

  if (input.targetScope === "all_active_field") {
    if (targetRole || targetUserId || targetWorkOrderId || targetCompanyId) {
      throw new AppError(
        "all_active_field messages cannot have a specific target",
        400,
        "INVALID_REQUEST",
      );
    }
  }

  if (input.targetScope === "role" && !targetRole) {
    throw new AppError(
      "target_role is required when target_scope is role",
      400,
      "INVALID_REQUEST",
    );
  }

  if (input.targetScope === "user" && !targetUserId) {
    throw new AppError(
      "target_user_id is required when target_scope is user",
      400,
      "INVALID_REQUEST",
    );
  }

  if (input.targetScope === "work_order" && !targetWorkOrderId) {
    throw new AppError(
      "target_work_order_id is required when target_scope is work_order",
      400,
      "INVALID_REQUEST",
    );
  }

  if (input.targetScope === "company" && !targetCompanyId) {
    throw new AppError(
      "target_company_id is required when target_scope is company",
      400,
      "INVALID_REQUEST",
    );
  }

  return {
    targetRole,
    targetUserId,
    targetWorkOrderId,
    targetCompanyId,
  };
}

async function isActiveFieldWorkerToday(userId: string, role: string) {
  if (!["installer", "delivery_lead", "dispatcher", "admin"].includes(role)) {
    return false;
  }

  const activeAssignment = await prisma.workOrderAssignment.findFirst({
    where: {
      userId,
      isActive: true,
      workOrder: {
        internalStatus: {
          in: ["scheduled", "dispatched", "on_site"],
        },
      },
    },
    select: { id: true },
  });

  return !!activeAssignment;
}

function mapDispatchMessage(message: any, userId: string) {
  const receipt =
    Array.isArray(message.readReceipts) && message.readReceipts.length > 0
      ? message.readReceipts[0]
      : null;

  return {
    id: message.id,
    title: message.title,
    body: message.body,
    priority: message.priority,
    target_scope: message.targetScope,
    target_role: message.targetRole,
    target_user_id: message.targetUserId,
    target_work_order_id: message.targetWorkOrderId,
    target_company_id: message.targetCompanyId,
    message_category: message.messageCategory,
    requires_acknowledgement: message.requiresAcknowledgement,
    is_active: message.isActive,
    is_read: !!receipt,
    acknowledged_at: receipt?.acknowledgedAt ?? null,
    expires_at: message.expiresAt,
    created_at: message.createdAt,
    updated_at: message.updatedAt,
    created_by: message.createdByUser
      ? {
          id: message.createdByUser.id,
          first_name: message.createdByUser.firstName,
          last_name: message.createdByUser.lastName,
          role: message.createdByUser.role,
        }
      : null,
  };
}
export async function createDispatchMessage(
  input: CreateDispatchMessageInput,
) {
  assertDispatchMessageAdminRole(input.role);

  const title = input.title.trim();
  const body = input.body.trim();

  if (!title) {
    throw new AppError("Title is required", 400, "INVALID_REQUEST");
  }

  if (!body) {
    throw new AppError("Body is required", 400, "INVALID_REQUEST");
  }

  const targetScope = normalizeTargetScope(input.targetScope);
  const messageCategory = normalizeMessageCategory(input.messageCategory);

  const { targetRole, targetUserId, targetWorkOrderId, targetCompanyId } =
    validateTargeting({
      targetScope,
      targetRole: input.targetRole,
      targetUserId: input.targetUserId,
      targetWorkOrderId: input.targetWorkOrderId,
      targetCompanyId: input.targetCompanyId,
    });

  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

  if (input.expiresAt && Number.isNaN(expiresAt?.getTime())) {
    throw new AppError("Invalid expires_at value", 400, "INVALID_REQUEST");
  }

  const message = await prisma.dispatchMessage.create({
    data: {
      title,
      body,
      priority: normalizePriority(input.priority),
      isActive: true,
      targetScope,
      targetRole: targetRole as any,
      targetUserId,
      targetWorkOrderId,
      targetCompanyId,
      messageCategory,
      requiresAcknowledgement:
        typeof input.requiresAcknowledgement === "boolean"
          ? input.requiresAcknowledgement
          : false,
      createdByUserId: input.userId,
      expiresAt,
    },
  });

  return {
    id: message.id,
    title: message.title,
    body: message.body,
    priority: message.priority,
    target_scope: message.targetScope,
    target_role: message.targetRole,
    target_user_id: message.targetUserId,
    target_work_order_id: message.targetWorkOrderId,
    target_company_id: message.targetCompanyId,
    message_category: message.messageCategory,
    requires_acknowledgement: message.requiresAcknowledgement,
    is_active: message.isActive,
    expires_at: message.expiresAt,
    created_at: message.createdAt,
    updated_at: message.updatedAt,
  };
}

export async function listDispatchMessages(
  input: ListDispatchMessagesInput,
) {
  assertDispatchMessageReadRole(input.role);

  const now = new Date();
  const activeFieldWorker = await isActiveFieldWorkerToday(input.userId, input.role);

  const baseMessages = await prisma.dispatchMessage.findMany({
  where: {
    isActive: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    ...(input.targetScope
      ? {
          targetScope: input.targetScope,
        }
      : {}),
    ...(input.messageCategory
      ? {
          messageCategory: input.messageCategory,
        }
      : {}),
  },
  include: {
    createdByUser: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    },
    readReceipts: {
      where: {
        userId: input.userId,
      },
    },
  },
  orderBy: [{ createdAt: "desc" }],
});

  const visibleMessages = baseMessages.filter((message) => {
    if (message.targetScope === "all_active_field") {
      return activeFieldWorker || input.role === "admin" || input.role === "dispatcher";
    }

    if (message.targetScope === "role") {
      return message.targetRole === input.role;
    }

    if (message.targetScope === "user") {
      return message.targetUserId === input.userId;
    }

    if (message.targetScope === "work_order") {
      if (!input.jobId) return false;
      return message.targetWorkOrderId === input.jobId;
    }

    if (message.targetScope === "company") {
      if (!input.companyId) return false;
      return message.targetCompanyId === input.companyId;
    }

    return false;
  });

  const mapped = visibleMessages.map((message) =>
    mapDispatchMessage(message, input.userId),
  );

  if (input.unreadOnly) {
    return mapped.filter((message) => !message.is_read);
  }

  return mapped;
}

export async function getPendingBlockingMessages(
  input: GetPendingBlockingMessagesInput,
) {
  assertDispatchMessageReadRole(input.role);

  const now = new Date();
  const activeFieldWorker = await isActiveFieldWorkerToday(input.userId, input.role);

  const baseMessages = await prisma.dispatchMessage.findMany({
  where: {
    isActive: true,
    priority: "urgent",
    requiresAcknowledgement: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  },
  include: {
    createdByUser: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    },
    readReceipts: {
      where: {
        userId: input.userId,
      },
    },
  },
  orderBy: [{ createdAt: "desc" }],
});
  const visibleMessages = baseMessages.filter((message) => {
    if (message.targetScope === "all_active_field") {
      return activeFieldWorker || input.role === "admin" || input.role === "dispatcher";
    }

    if (message.targetScope === "role") {
      return message.targetRole === input.role;
    }

    if (message.targetScope === "user") {
      return message.targetUserId === input.userId;
    }

    if (message.targetScope === "work_order") {
      if (!input.jobId) return false;
      return message.targetWorkOrderId === input.jobId;
    }

    if (message.targetScope === "company") {
      if (!input.companyId) return false;
      return message.targetCompanyId === input.companyId;
    }

    return false;
  });

  const pending = visibleMessages.filter((message) => {
    const receipt = message.readReceipts[0];
    return !receipt?.acknowledgedAt;
  });

  return pending.map((message) => mapDispatchMessage(message, input.userId));
}

export async function markDispatchMessageRead(
  input: MarkDispatchMessageReadInput,
) {
  assertDispatchMessageReadRole(input.role);

  const message = await prisma.dispatchMessage.findUnique({
    where: { id: input.id },
  });

  if (!message) {
    throw new AppError("Dispatch message not found", 404, "MESSAGE_NOT_FOUND");
  }

  await prisma.dispatchMessageRead.upsert({
    where: {
      dispatchMessageId_userId: {
        dispatchMessageId: input.id,
        userId: input.userId,
      },
    },
    update: {
      readAt: new Date(),
    },
    create: {
      dispatchMessageId: input.id,
      userId: input.userId,
    },
  });

  return {
    id: message.id,
    status: "read",
  };
}

export async function acknowledgeDispatchMessage(
  input: AcknowledgeDispatchMessageInput,
) {
  assertDispatchMessageReadRole(input.role);

  const message = await prisma.dispatchMessage.findUnique({
    where: { id: input.id },
  });

  if (!message) {
    throw new AppError("Dispatch message not found", 404, "MESSAGE_NOT_FOUND");
  }

  const receipt = await prisma.dispatchMessageRead.upsert({
    where: {
      dispatchMessageId_userId: {
        dispatchMessageId: input.id,
        userId: input.userId,
      },
    },
    update: {
      readAt: new Date(),
      acknowledgedAt: new Date(),
    },
    create: {
      dispatchMessageId: input.id,
      userId: input.userId,
      acknowledgedAt: new Date(),
    },
  });

  return {
    id: message.id,
    status: "acknowledged",
    read_at: receipt.readAt,
    acknowledged_at: receipt.acknowledgedAt,
  };
}


export async function updateDispatchMessage(
  input: UpdateDispatchMessageInput,
) {
  assertDispatchMessageAdminRole(input.role);

  const existing = await prisma.dispatchMessage.findUnique({
    where: { id: input.id },
  });

  if (!existing) {
    throw new AppError("Dispatch message not found", 404, "MESSAGE_NOT_FOUND");
  }

  const targetScope = input.targetScope
    ? normalizeTargetScope(input.targetScope)
    : existing.targetScope;

  const messageCategory = input.messageCategory
    ? normalizeMessageCategory(input.messageCategory)
    : existing.messageCategory;

  const { targetRole, targetUserId, targetWorkOrderId, targetCompanyId } =
    validateTargeting({
      targetScope,
      targetRole:
        input.targetRole === undefined ? existing.targetRole : input.targetRole,
      targetUserId:
        input.targetUserId === undefined
          ? existing.targetUserId
          : input.targetUserId,
      targetWorkOrderId:
        input.targetWorkOrderId === undefined
          ? existing.targetWorkOrderId
          : input.targetWorkOrderId,
      targetCompanyId:
        input.targetCompanyId === undefined
          ? existing.targetCompanyId
          : input.targetCompanyId,
    });

  const expiresAt =
    input.expiresAt === undefined
      ? undefined
      : input.expiresAt === null
        ? null
        : new Date(input.expiresAt);

  if (
    typeof input.expiresAt === "string" &&
    Number.isNaN(expiresAt?.getTime?.())
  ) {
    throw new AppError("Invalid expires_at value", 400, "INVALID_REQUEST");
  }

  const updated = await prisma.dispatchMessage.update({
    where: { id: input.id },
    data: {
      title: input.title?.trim() || undefined,
      body: input.body?.trim() || undefined,
      priority: input.priority ? normalizePriority(input.priority) : undefined,
      isActive:
        typeof input.isActive === "boolean" ? input.isActive : undefined,
      targetScope,
      targetRole: targetRole as any,
      targetUserId,
      targetWorkOrderId,
      targetCompanyId,
      messageCategory,
      requiresAcknowledgement:
        typeof input.requiresAcknowledgement === "boolean"
          ? input.requiresAcknowledgement
          : undefined,
      expiresAt,
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    body: updated.body,
    priority: updated.priority,
    target_scope: updated.targetScope,
    target_role: updated.targetRole,
    target_user_id: updated.targetUserId,
    target_work_order_id: updated.targetWorkOrderId,
    target_company_id: updated.targetCompanyId,
    message_category: updated.messageCategory,
    requires_acknowledgement: updated.requiresAcknowledgement,
    is_active: updated.isActive,
    expires_at: updated.expiresAt,
    created_at: updated.createdAt,
    updated_at: updated.updatedAt,
  };
}

  export async function getDispatchMessageDetail(
  input: GetDispatchMessageDetailInput,
) {
  assertDispatchMessageReadRole(input.role);

  const message = await prisma.dispatchMessage.findUnique({
    where: { id: input.id },
    include: {
      createdByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      readReceipts: {
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
        orderBy: {
          readAt: "desc",
        },
      },
    },
  });

  if (!message) {
    throw new AppError("Dispatch message not found", 404, "MESSAGE_NOT_FOUND");
  }

  return {
    id: message.id,
    title: message.title,
    body: message.body,
    priority: message.priority,
    target_scope: message.targetScope,
    target_role: message.targetRole,
    target_user_id: message.targetUserId,
    target_work_order_id: message.targetWorkOrderId,
    target_company_id: message.targetCompanyId,
    message_category: message.messageCategory,
    requires_acknowledgement: message.requiresAcknowledgement,
    is_active: message.isActive,
    expires_at: message.expiresAt,
    created_at: message.createdAt,
    updated_at: message.updatedAt,
    created_by: message.createdByUser
      ? {
          id: message.createdByUser.id,
          first_name: message.createdByUser.firstName,
          last_name: message.createdByUser.lastName,
          role: message.createdByUser.role,
        }
      : null,
    receipts: message.readReceipts.map((receipt) => ({
      id: receipt.id,
      read_at: receipt.readAt,
      acknowledged_at: receipt.acknowledgedAt,
      user: {
        id: receipt.user.id,
        first_name: receipt.user.firstName,
        last_name: receipt.user.lastName,
        role: receipt.user.role,
      },
    })),
  };
}