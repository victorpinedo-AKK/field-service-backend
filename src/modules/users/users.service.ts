import bcrypt from "bcryptjs";
import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";

const ALLOWED_ROLES = ["admin", "dispatcher", "installer", "delivery_lead"];

function assertAdminOnly(role: string) {
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
  companyId?: string | null;
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
  companyId?: string | null;
}

function normalizeNullableString(value?: string | null) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function ensureCompanyExists(companyId?: string | null) {
  const normalized = normalizeNullableString(companyId);

  if (!normalized) return null;

  const company = await prisma.company.findUnique({
    where: { id: normalized },
    select: { id: true },
  });

  if (!company) {
    throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  return normalized;
}

export async function listUsers(input: ListUsersInput) {
  assertAdminOnly(input.actorRole);

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          companyType: true,
          division: true,
          isActive: true,
        },
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    role: user.role,
    is_active: user.isActive,
    company_id: user.companyId,
    company: user.company
      ? {
          id: user.company.id,
          name: user.company.name,
          company_type: user.company.companyType,
          division: user.company.division,
          is_active: user.company.isActive,
        }
      : null,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  }));
}

export async function createUser(input: CreateUserInput) {
  assertAdminOnly(input.actorRole);

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

  const companyId = await ensureCompanyExists(input.companyId);
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      passwordHash,
      role: input.role as any,
      isActive: input.isActive ?? true,
      companyId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          companyType: true,
          division: true,
          isActive: true,
        },
      },
    },
  });

  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    role: user.role,
    is_active: user.isActive,
    company_id: user.companyId,
    company: user.company
      ? {
          id: user.company.id,
          name: user.company.name,
          company_type: user.company.companyType,
          division: user.company.division,
          is_active: user.company.isActive,
        }
      : null,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export async function updateUser(input: UpdateUserInput) {
  assertAdminOnly(input.actorRole);

  const existing = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, companyId: true },
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

  const companyId =
    input.companyId === undefined
      ? undefined
      : await ensureCompanyExists(input.companyId);

  const user = await prisma.user.update({
    where: { id: input.userId },
    data: {
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      email: nextEmail,
      role: input.role as any,
      isActive: input.isActive,
      passwordHash,
      companyId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          companyType: true,
          division: true,
          isActive: true,
        },
      },
    },
  });
  

  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    role: user.role,
    is_active: user.isActive,
    company_id: user.companyId,
    company: user.company
      ? {
          id: user.company.id,
          name: user.company.name,
          company_type: user.company.companyType,
          division: user.company.division,
          is_active: user.company.isActive,
        }
      : null,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
  
}
export async function deleteUser(input: {
  actorRole: string;
  userId: string;
  actorUserId: string;
}) {
  assertAdminOnly(input.actorRole);

  if (input.userId === input.actorUserId) {
    throw new AppError(
      "You cannot delete your own account",
      400,
      "INVALID_REQUEST"
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  await prisma.user.delete({
    where: { id: input.userId },
  });

  return { success: true };
}