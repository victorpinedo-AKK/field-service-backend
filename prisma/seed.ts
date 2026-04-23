import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@akk.local" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@akk.local",
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });

  // Installer
  await prisma.user.upsert({
    where: { email: "installer@akk.local" },
    update: {},
    create: {
      firstName: "Field",
      lastName: "Installer",
      email: "installer@akk.local",
      passwordHash,
      role: "installer",
      isActive: true,
    },
  });

  // Dispatcher
  await prisma.user.upsert({
    where: { email: "dispatcher@akk.local" },
    update: {},
    create: {
      firstName: "Dispatch",
      lastName: "Lead",
      email: "dispatcher@akk.local",
      passwordHash,
      role: "dispatcher",
      isActive: true,
    },
  });

  console.log("🌱 Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });