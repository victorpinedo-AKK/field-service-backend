import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";

interface CreateDispatchMessageInput {
  userId: string;
  role: string;
  title: string;
  body: string;
  priority?: string;
  targetRole?: string;
  targetUserId?: string;
  targetWorkOrderId?: string;
  expiresAt?: string;
}

interface ListDispatchMessagesInput {
  userId: string;
  role: string;
  jobId?: string;
  unreadOnly?: boolean;
}

interface MarkDispatchMessageReadInput {
  id: string;
  userId: string;
  role: string;
}

interface UpdateDispatchMessageInput {
  id: string;
  userId: string;
  role: string;
  title?: string;
  body?: string;
  priority?: string;
  isActive?: boolean;
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
      targetRole: input.targetRole?.trim() || null,
      targetUserId: input.targetUserId?.trim() || null,
      targetWorkOrderId: input.targetWorkOrderId?.trim() || null,
      createdByUserId: input.userId,
      expiresAt,
    },
  });

  return {
    id: message.id,
    title: message.title,
    body: message.body,
    priority: message.priority,
    target_role: message.targetRole,
    target_user_id: message.targetUserId,
    target_work_order_id: message.targetWorkOrderId,
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

  const messages = await prisma.dispatchMessage.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [
        {
          OR: [
            { targetRole: input.role },
            { targetUserId: input.userId },
            ...(input.jobId ? [{ targetWorkOrderId: input.jobId }] : []),
            {
              targetRole: null,
              targetUserId: null,
              targetWorkOrderId: null,
            },
          ],
        },
      ],
    },
    include: {
      readReceipts: {
        where: {
          userId: input.userId,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const mapped = messages.map((message) => ({
    id: message.id,
    title: message.title,
    body: message.body,
    priority: message.priority,
    target_role: message.targetRole,
    target_user_id: message.targetUserId,
    target_work_order_id: message.targetWorkOrderId,
    is_active: message.isActive,
    is_read: message.readReceipts.length > 0,
    expires_at: message.expiresAt,
    created_at: message.createdAt,
    updated_at: message.updatedAt,
  }));

  if (input.unreadOnly) {
    return mapped.filter((message) => !message.is_read);
  }

  return mapped;
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
      expiresAt,
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    body: updated.body,
    priority: updated.priority,
    target_role: updated.targetRole,
    target_user_id: updated.targetUserId,
    target_work_order_id: updated.targetWorkOrderId,
    is_active: updated.isActive,
    expires_at: updated.expiresAt,
    created_at: updated.createdAt,
    updated_at: updated.updatedAt,
  };
}