import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("🌱 Seeding database...");

  // -----------------------
  // COMPANY
  // -----------------------
  const company = await prisma.company.upsert({
    where: { name: "AKK Internal" },
    update: {},
    create: {
      name: "AKK Internal",
      companyType: "internal",
      division: "hotshots",
    },
  });

  // -----------------------
  // USERS
  // -----------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@akk.local" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@akk.local",
      passwordHash,
      role: UserRole.admin,
      companyId: company.id,
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { email: "dispatcher@akk.local" },
    update: {},
    create: {
      firstName: "Dispatch",
      lastName: "Manager",
      email: "dispatcher@akk.local",
      passwordHash,
      role: UserRole.dispatcher,
      companyId: company.id,
    },
  });

  const installer = await prisma.user.upsert({
    where: { email: "installer@akk.local" },
    update: {},
    create: {
      firstName: "Field",
      lastName: "Installer",
      email: "installer@akk.local",
      passwordHash,
      role: UserRole.installer,
      companyId: company.id,
    },
  });

  // -----------------------
  // CUSTOMER
  // -----------------------
  const customer = await prisma.customer.create({
    data: {
      fullName: "Test Customer",
      phone: "555-123-4567",
    },
  });

  const address = await prisma.address.create({
    data: {
      line1: "123 Test Street",
      city: "Austin",
      state: "TX",
      postalCode: "73301",
      country: "USA",
    },
  });

  // -----------------------
  // WORK ORDER (HOTSHOT)
  // -----------------------
  const workOrder = await prisma.workOrder.create({
    data: {
      workOrderNumber: "HS-1001",
      customerId: customer.id,
      addressId: address.id,
      jobType: "delivery",
      internalStatus: "dispatched",
      division: "hotshots",
    },
  });

  // Active assignment (THIS is critical for "all_active_field")
  await prisma.workOrderAssignment.create({
    data: {
      workOrderId: workOrder.id,
      userId: installer.id,
      assignmentType: "delivery",
      isActive: true,
    },
  });

  // -----------------------
  // DISPATCH MESSAGES
  // -----------------------

  // 1. ALL ACTIVE FIELD
  await prisma.dispatchMessage.create({
    data: {
      title: "Weekend Prep",
      body: "Please chock all trucks and leave keys in the lockbox.",
      priority: "normal",
      targetScope: "all_active_field",
      messageCategory: "operations",
      createdByUserId: dispatcher.id,
    },
  });

  // 2. ROLE (Installers)
  await prisma.dispatchMessage.create({
    data: {
      title: "Installer Reminder",
      body: "Make sure photos are uploaded before leaving each job.",
      priority: "normal",
      targetScope: "role",
      targetRole: "installer",
      messageCategory: "operations",
      createdByUserId: dispatcher.id,
    },
  });

  // 3. USER (Personal)
  await prisma.dispatchMessage.create({
    data: {
      title: "Route Adjustment",
      body: "Stop by warehouse before your first drop.",
      priority: "urgent",
      targetScope: "user",
      targetUserId: installer.id,
      messageCategory: "operations",
      createdByUserId: dispatcher.id,
    },
  });

  // 4. WORK ORDER
  await prisma.dispatchMessage.create({
    data: {
      title: "Job-Specific Note",
      body: "Customer requested rear entrance delivery.",
      priority: "normal",
      targetScope: "work_order",
      targetWorkOrderId: workOrder.id,
      messageCategory: "operations",
      createdByUserId: dispatcher.id,
    },
  });

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });