import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";

interface ListJobsInput {
  userId: string;
  role: string;
  scope?: string;
  status?: string;
  date?: string;
}

interface GetJobDetailInput {
  jobId: string;
  userId: string;
  role: string;
}

export async function listJobs(input: ListJobsInput) {
  const where: Record<string, unknown> = {};

  if (input.status) {
    where.internalStatus = input.status;
  }

  if (input.date) {
    const start = new Date(`${input.date}T00:00:00.000Z`);
    const end = new Date(`${input.date}T23:59:59.999Z`);

    where.scheduledStartAt = {
      gte: start,
      lte: end,
    };
  }

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);
  const wantsMyJobs = input.scope === "my_jobs" || isFieldRole;

  if (wantsMyJobs) {
    where.assignments = {
      some: {
        userId: input.userId,
        isActive: true,
      },
    };
  }

  if (!["admin", "dispatcher", "installer", "delivery_lead"].includes(input.role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const jobs = await prisma.workOrder.findMany({
    where,
    orderBy: [{ scheduledStartAt: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      workOrderNumber: true,
      jobType: true,
      internalStatus: true,
      priority: true,
      scheduledStartAt: true,
      scheduledEndAt: true,
      customer: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
      address: {
        select: {
          id: true,
          line1: true,
          city: true,
          state: true,
        },
      },
    },
  });

  return jobs.map((job) => ({
    id: job.id,
    work_order_number: job.workOrderNumber,
    job_type: job.jobType,
    internal_status: job.internalStatus,
    priority: job.priority,
    scheduled_start_at: job.scheduledStartAt,
    scheduled_end_at: job.scheduledEndAt,
    customer: {
      id: job.customer.id,
      full_name: job.customer.fullName,
      phone: job.customer.phone,
    },
    address: {
      id: job.address.id,
      line1: job.address.line1,
      city: job.address.city,
      state: job.address.state,
    },
  }));
}

export async function getJobDetail(input: GetJobDetailInput) {
  if (!["admin", "dispatcher", "installer", "delivery_lead"].includes(input.role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const isFieldRole = ["installer", "delivery_lead"].includes(input.role);

  const job = await prisma.workOrder.findFirst({
    where: {
      id: input.jobId,
      ...(isFieldRole
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
          team: {
            select: {
              id: true,
              name: true,
              teamType: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  if (!job) {
    throw new AppError("Job not found", 404, "JOB_NOT_FOUND");
  }

  return {
    id: job.id,
    work_order_number: job.workOrderNumber,
    job_type: job.jobType,
    internal_status: job.internalStatus,
    priority: job.priority,
    scheduled_start_at: job.scheduledStartAt,
    scheduled_end_at: job.scheduledEndAt,
    dispatcher_notes: job.dispatcherNotes,
    access_notes: job.accessNotes,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
    customer: {
      id: job.customer.id,
      full_name: job.customer.fullName,
      email: job.customer.email,
      phone: job.customer.phone,
    },
    address: {
      id: job.address.id,
      line1: job.address.line1,
      line2: job.address.line2,
      city: job.address.city,
      state: job.address.state,
      postal_code: job.address.postalCode,
      country: job.address.country,
      access_notes: job.address.accessNotes,
    },
    assignments: job.assignments.map((assignment) => ({
      id: assignment.id,
      assignment_type: assignment.assignmentType,
      assigned_at: assignment.assignedAt,
      team: assignment.team
        ? {
            id: assignment.team.id,
            name: assignment.team.name,
            team_type: assignment.team.teamType,
          }
        : null,
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
  };
}