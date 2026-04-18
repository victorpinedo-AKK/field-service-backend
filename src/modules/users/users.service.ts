import bcrypt from "bcryptjs";
import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";

const ALLOWED_ROLES = ["admin", "dispatcher", "installer", "delivery_lead"];

function assertAdminOrDispatcher(role: string) {
  if (role !== "admin") {
  throw new AppError("Forbidden", 403, "FORBIDDEN");
}
}

interface CreateUserInput {
  actorRole: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  isActive?: boolean;
}

interface ListUsersInput {
  actorRole: string;
}

interface UpdateUserInput {
  actorRole: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  password?: string;
}

export async function listUsers(input: ListUsersInput) {
  assertAdminOrDispatcher(input.actorRole);

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    role: user.role,
    is_active: user.isActive,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  }));
}

export async function createUser(input: CreateUserInput) {
  assertAdminOrDispatcher(input.actorRole);

  const email = input.email.trim().toLowerCase();

  if (!input.firstName.trim()) {
    throw new AppError("First name is required", 400, "INVALID_REQUEST");
  }

  if (!input.lastName.trim()) {
    throw new AppError("Last name is required", 400, "INVALID_REQUEST");
  }

  if (!email) {
    throw new AppError("Email is required", 400, "INVALID_REQUEST");
  }

  if (!input.password || input.password.length < 8) {
    throw new AppError(
      "Password must be at least 8 characters",
      400,
      "INVALID_REQUEST",
    );
  }

  if (!ALLOWED_ROLES.includes(input.role)) {
    throw new AppError("Invalid role", 400, "INVALID_REQUEST");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError("Email already in use", 409, "EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      passwordHash,
      role: input.role as any,
      isActive: input.isActive ?? true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    role: user.role,
    is_active: user.isActive,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export async function updateUser(input: UpdateUserInput) {
  assertAdminOrDispatcher(input.actorRole);

  const existing = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true },
  });

  if (!existing) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  let passwordHash: string | undefined;

  if (input.password !== undefined) {
    if (!input.password || input.password.length < 8) {
      throw new AppError(
        "Password must be at least 8 characters",
        400,
        "INVALID_REQUEST",
      );
    }

    passwordHash = await bcrypt.hash(input.password, 10);
  }

  if (input.role && !ALLOWED_ROLES.includes(input.role)) {
    throw new AppError("Invalid role", 400, "INVALID_REQUEST");
  }

  let nextEmail: string | undefined;
  if (input.email !== undefined) {
    nextEmail = input.email.trim().toLowerCase();

    if (!nextEmail) {
      throw new AppError("Email is required", 400, "INVALID_REQUEST");
    }

    const emailOwner = await prisma.user.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    });

    if (emailOwner && emailOwner.id !== input.userId) {
      throw new AppError("Email already in use", 409, "EMAIL_ALREADY_EXISTS");
    }
  }

  const user = await prisma.user.update({
    where: { id: input.userId },
    data: {
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      email: nextEmail,
      role: input.role as any,
      isActive: input.isActive,
      passwordHash,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    role: user.role,
    is_active: user.isActive,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}