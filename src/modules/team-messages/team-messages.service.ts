import { prisma } from "../../config/db";
import { AppError } from "../../common/errors/AppError";

interface ListTeamMessagesInput {
  userId: string;
  role: string;
  teamId?: string;
}

interface CreateTeamMessageInput {
  userId: string;
  role: string;
  teamId?: string;
  body: string;
}

function assertAllowedRole(role: string) {
  const allowedRoles = ["admin", "dispatcher", "installer", "delivery_lead"];

  if (!allowedRoles.includes(role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}

function extractMentions(body: string): string[] {
  const matches = body.match(/@(\w+)/g) || [];
  return matches.map((m) => m.replace("@", ""));

}

async function sendPushNotification(tokens: string[], message: string) {
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      tokens.map((token) => ({
        to: token,
        sound: "default",
        title: "AKK Team Message",
        body: message,
        data: { screen: "TeamMessages" },
      })),
    ),
  });
}

export async function listTeamMessages(input: ListTeamMessagesInput) {
  assertAllowedRole(input.role);

  const messages = await prisma.teamMessage.findMany({
    where: {
      ...(input.teamId ? { teamId: input.teamId } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          teamType: true,
          division: true,
        },
      },
    },
    take: 100,
  });

  return messages.map((message) => ({
    id: message.id,
    body: message.body,
    created_at: message.createdAt,
    sender: {
      id: message.user.id,
      first_name: message.user.firstName,
      last_name: message.user.lastName,
      role: message.user.role,
    },
    team: message.team
      ? {
          id: message.team.id,
          name: message.team.name,
          team_type: message.team.teamType,
          division: message.team.division,
        }
      : null,
  }));
}

export async function createTeamMessage(input: CreateTeamMessageInput) {
  assertAllowedRole(input.role);

  const trimmedBody = input.body.trim();

  if (!trimmedBody) {
    throw new AppError("Message body is required", 400, "INVALID_REQUEST");
  }

  if (input.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: input.teamId },
      select: { id: true, isActive: true },
    });

    if (!team || !team.isActive) {
      throw new AppError("Team not found", 404, "TEAM_NOT_FOUND");
    }
  }

  const pushTokens = await prisma.userPushToken.findMany({
  select: { token: true },
});

const tokens = pushTokens.map((t) => t.token);

if (tokens.length) {
  await sendPushNotification(tokens, input.body);
}

  const message = await prisma.teamMessage.create({
    data: {
      teamId: input.teamId || null,
      userId: input.userId,
      body: trimmedBody,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          teamType: true,
          division: true,
        },
      },
    },
  });

  return {
    id: message.id,
    body: message.body,
    created_at: message.createdAt,
    sender: {
      id: message.user.id,
      first_name: message.user.firstName,
      last_name: message.user.lastName,
      role: message.user.role,
    },
    team: message.team
      ? {
          id: message.team.id,
          name: message.team.name,
          team_type: message.team.teamType,
          division: message.team.division,
        }
      : null,
  };
}