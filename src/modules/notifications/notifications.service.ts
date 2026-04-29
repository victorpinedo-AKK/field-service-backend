export async function notifyCustomerHotshotAccepted(job: any) {
  console.log("📲 NOTIFY CUSTOMER (MOCK)");
  console.log("Customer:", job.customer?.fullName);
  console.log("Phone:", job.customer?.phone);
  console.log("Email:", job.customer?.email);
  console.log("Pickup:", job.hotShotDetails?.pickupAddress1);
  console.log("Dropoff:", job.hotShotDetails?.dropoffAddress1);
}