import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

const r2Endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

console.log("R2 ACCOUNT ID:", JSON.stringify(env.R2_ACCOUNT_ID));
console.log("R2 ENDPOINT:", r2Endpoint);

export const r2 = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});