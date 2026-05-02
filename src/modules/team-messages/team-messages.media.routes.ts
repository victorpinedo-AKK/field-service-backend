import { Router } from "express";
import { upload } from "../../middleware/upload";
import { r2 } from "../../config/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../../config/env";
import { randomUUID } from "crypto";

const router = Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: "No file uploaded" },
      });
    }

    const file = req.file;

    const key = `team-messages/${Date.now()}-${randomUUID()}.jpg`;

    await r2.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = `${env.R2_PUBLIC_BASE_URL}/${key}`;

    return res.json({
      success: true,
      data: {
        url,
      },
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    return res.status(500).json({
      success: false,
      error: { message: "Upload failed" },
    });
  }
});

export default router;