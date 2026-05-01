import { prisma } from "../../config/db";

export async function savePushToken(input: {
  userId: string;
  token: string;
  platform?: string;
}) {
  return prisma.userPushToken.upsert({
    where: { token: input.token },
    update: {
      userId: input.userId,
      platform: input.platform || null,
    },
    create: {
      userId: input.userId,
      token: input.token,
      platform: input.platform || null,
    },
  });
}