import bcrypt from "bcrypt";
import {
  PrismaClient,
  Division,
  JobStatus,
  JobType,
  TeamType,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const installer = await prisma.user.upsert({
    where: { email: "installer@akk.local" },
    update: {},
    create: {
      firstName: "Field",
      lastName: "Installer",
      email: "installer@akk.local",
      passwordHash,
      role: UserRole.installer,
    },
  });

  await prisma.user.upsert({
    where: { email: "dispatcher@akk.local" },
    update: {},
    create: {
      firstName: "Dispatch",
      lastName: "Manager",
      email: "dispatcher@akk.local",
      passwordHash,
      role: UserRole.dispatcher,
    },
  });

  await prisma.user.upsert({
    where: { email: "victor.pinedo@akkinstallations.com" },
    update: {},
    create: {
      firstName: "Victor",
      lastName: "Pinedo",
      email: "victor.pinedo@akkinstallations.com",
      passwordHash,
      role: UserRole.admin,
    },
  });

  const team = await prisma.team.upsert({
    where: { id: "crew-a-team-id" },
    update: {},
    create: {
      id: "crew-a-team-id",
      name: "Crew A",
      teamType: TeamType.hybrid,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { id: "john-smith-customer-id" },
    update: {},
    create: {
      id: "john-smith-customer-id",
      fullName: "John Smith",
      email: "john@example.com",
      phone: "+1-555-555-5555",
    },
  });

  const address = await prisma.address.upsert({
    where: { id: "john-smith-address-id" },
    update: {},
    create: {
      id: "john-smith-address-id",
      customerId: customer.id,
      line1: "123 Main St",
      city: "Denver",
      state: "CO",
      postalCode: "80202",
      country: "US",
      accessNotes: "Gate code 771",
    },
  });

  const workOrder = await prisma.workOrder.upsert({
    where: { workOrderNumber: "WO-10482" },
    update: {},
    create: {
      workOrderNumber: "WO-10482",
      customerId: customer.id,
      addressId: address.id,
      division: Division.construction,
      jobType: JobType.installation,
      internalStatus: JobStatus.scheduled,
      priority: "normal",
      dispatcherNotes: "Customer prefers rear entrance",
      accessNotes: "Gate code 771",
    },
  });

  await prisma.workOrderAssignment.upsert({
    where: { id: "wo-10482-primary-assignment" },
    update: {},
    create: {
      id: "wo-10482-primary-assignment",
      workOrderId: workOrder.id,
      userId: installer.id,
      teamId: team.id,
      assignmentType: "primary",
      isActive: true,
    },
  });

  const hotshotCustomer = await prisma.customer.upsert({
    where: { id: "rapid-delivery-customer-id" },
    update: {},
    create: {
      id: "rapid-delivery-customer-id",
      fullName: "Rapid Delivery Client",
      email: "rapid@example.com",
      phone: "+1-555-111-2222",
    },
  });

  const hotshotAddress = await prisma.address.upsert({
    where: { id: "rapid-delivery-address-id" },
    update: {},
    create: {
      id: "rapid-delivery-address-id",
      customerId: hotshotCustomer.id,
      line1: "550 Pickup Ave",
      city: "Denver",
      state: "CO",
      postalCode: "80216",
      country: "US",
    },
  });

  const hotshotWorkOrder = await prisma.workOrder.upsert({
    where: { workOrderNumber: "HS-10001" },
    update: {},
    create: {
      workOrderNumber: "HS-10001",
      customerId: hotshotCustomer.id,
      addressId: hotshotAddress.id,
      division: Division.hotshots,
      jobType: JobType.delivery,
      internalStatus: JobStatus.ready_to_schedule,
      priority: "high",
      dispatcherNotes: "Urgent same-day delivery",
      accessNotes: "Call on arrival",
    },
  });

  await prisma.hotShotDetails.upsert({
    where: { workOrderId: hotshotWorkOrder.id },
    update: {},
    create: {
      workOrderId: hotshotWorkOrder.id,
      pickupName: "Warehouse A",
      pickupPhone: "+1-555-333-4444",
      pickupAddress1: "550 Pickup Ave",
      pickupCity: "Denver",
      pickupState: "CO",
      pickupPostalCode: "80216",
      dropoffName: "Job Site B",
      dropoffPhone: "+1-555-888-9999",
      dropoffAddress1: "880 Delivery Ln",
      dropoffCity: "Colorado Springs",
      dropoffState: "CO",
      dropoffPostalCode: "80903",
      urgency: "urgent",
    },
  });

  const hotshotCustomer2 = await prisma.customer.upsert({
    where: { id: "express-logistics-customer-id" },
    update: {},
    create: {
      id: "express-logistics-customer-id",
      fullName: "Express Logistics",
      email: "dispatch@express.com",
      phone: "+1-555-222-3333",
    },
  });

  const hotshotAddress2 = await prisma.address.upsert({
    where: { id: "express-logistics-address-id" },
    update: {},
    create: {
      id: "express-logistics-address-id",
      customerId: hotshotCustomer2.id,
      line1: "1000 Supply Rd",
      city: "Denver",
      state: "CO",
      postalCode: "80216",
      country: "US",
    },
  });

  const hotshotWorkOrder2 = await prisma.workOrder.upsert({
    where: { workOrderNumber: "HS-10002" },
    update: {},
    create: {
      workOrderNumber: "HS-10002",
      customerId: hotshotCustomer2.id,
      addressId: hotshotAddress2.id,
      division: Division.hotshots,
      jobType: JobType.delivery,
      internalStatus: JobStatus.ready_to_schedule,
      priority: "normal",
      dispatcherNotes: "Standard delivery",
      accessNotes: "Call on arrival",
    },
  });

  await prisma.hotShotDetails.upsert({
    where: { workOrderId: hotshotWorkOrder2.id },
    update: {},
    create: {
      workOrderId: hotshotWorkOrder2.id,
      pickupName: "Distribution Center X",
      pickupPhone: "+1-555-444-5555",
      pickupAddress1: "1000 Supply Rd",
      pickupCity: "Denver",
      pickupState: "CO",
      pickupPostalCode: "80216",
      dropoffName: "Retail Store Y",
      dropoffPhone: "+1-555-777-8888",
      dropoffAddress1: "200 Market St",
      dropoffCity: "Boulder",
      dropoffState: "CO",
      dropoffPostalCode: "80301",
      urgency: "normal",
    },
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });